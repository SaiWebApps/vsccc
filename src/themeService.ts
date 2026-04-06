import * as vscode from 'vscode';

export function getAllThemeLabels(): string[] {
    const labels: string[] = [];
    for (const ext of vscode.extensions.all) {
        const themes = ext.packageJSON?.contributes?.themes;
        if (Array.isArray(themes)) {
            for (const t of themes) {
                if (typeof t.label === 'string') {
                    labels.push(t.label);
                }
            }
        }
    }
    return labels;
}

export function pickRandomTheme(recentThemes: string[], currentTheme?: string): string | undefined {
    const all = getAllThemeLabels();
    const recentSet = new Set(recentThemes);

    // First try: exclude everything in the recent history
    let candidates = all.filter(label => !recentSet.has(label));

    // Fallback: if history exhausted all candidates, only exclude the current theme
    if (candidates.length === 0) {
        candidates = all.filter(label => label !== currentTheme);
    }

    // Last resort: allow anything
    if (candidates.length === 0) {
        return all.length > 0 ? all[0] : undefined;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}

export async function applyRandomTheme(context: vscode.ExtensionContext): Promise<string | undefined> {
    const config = vscode.workspace.getConfiguration('workbench');
    const currentTheme = config.get<string>('colorTheme');

    const recentThemes = context.globalState.get<string[]>('vsccc.recentThemes', []);
    const newTheme = pickRandomTheme(recentThemes, currentTheme);
    if (!newTheme) {
        return undefined;
    }

    await config.update('colorTheme', newTheme, vscode.ConfigurationTarget.Global);

    // Update the recent history (FIFO). Size = half of total themes.
    const totalThemes = getAllThemeLabels().length;
    const maxHistory = Math.max(1, Math.floor(totalThemes / 2));
    const updatedRecent = [...recentThemes, newTheme].slice(-maxHistory);
    await context.globalState.update('vsccc.recentThemes', updatedRecent);

    return newTheme;
}
