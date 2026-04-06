import * as vscode from 'vscode';
import { applyRandomTheme } from './themeService';
import { showRecommendation } from './marketplace';
import { startScheduler, stopScheduler } from './scheduler';
import { createSettingsPanel } from './settingsPanel';

let statusBarItem: vscode.StatusBarItem | undefined;

function isStatusBarVisible(): boolean {
    return vscode.workspace.getConfiguration('vsccc').get<boolean>('showStatusBarIcon', true);
}

function getCurrentThemeName(): string {
    return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', 'Default');
}

function syncStatusBar(): void {
    if (isStatusBarVisible()) {
        if (!statusBarItem) {
            statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            statusBarItem.tooltip = 'Theme Carousel: Open Settings';
            statusBarItem.command = 'vsccc.openSettings';
        }
        statusBarItem.text = `$(symbol-color) ${getCurrentThemeName()}`;
        statusBarItem.show();
    } else {
        statusBarItem?.hide();
    }
}

/**
 * Show a switch notification only if the status bar is not visible.
 * When the status bar is showing, the theme name is already displayed there.
 */
function notifySwitch(theme: string): void {
    if (!isStatusBarVisible()) {
        vscode.window.showInformationMessage(`Theme Carousel: Switched to "${theme}"`);
    }
}

export { syncStatusBar, notifySwitch };

export function activate(context: vscode.ExtensionContext): void {
    // Manual switch command
    const switchCmd = vscode.commands.registerCommand('vsccc.switchTheme', async () => {
        const theme = await applyRandomTheme(context);
        if (theme) {
            syncStatusBar();
            notifySwitch(theme);
        } else {
            vscode.window.showWarningMessage('Theme Carousel: No themes available to switch to.');
        }
    });
    context.subscriptions.push(switchCmd);

    // Manual recommend command
    const recommendCmd = vscode.commands.registerCommand('vsccc.recommendTheme', async () => {
        await showRecommendation(context);
    });
    context.subscriptions.push(recommendCmd);

    // Open settings panel command
    const settingsCmd = vscode.commands.registerCommand('vsccc.openSettings', () => {
        createSettingsPanel(context);
    });
    context.subscriptions.push(settingsCmd);

    // Status bar icon
    syncStatusBar();
    if (statusBarItem) {
        context.subscriptions.push(statusBarItem);
    }

    // Start the scheduler
    startScheduler(context);

    // Restart scheduler + sync status bar when config changes
    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('vsccc') || e.affectsConfiguration('workbench.colorTheme')) {
            stopScheduler();
            startScheduler(context);
            syncStatusBar();
        }
    });
    context.subscriptions.push(configListener);
}

export function deactivate(): void {
    stopScheduler();
}
