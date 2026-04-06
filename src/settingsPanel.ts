import * as vscode from 'vscode';

let currentPanel: vscode.WebviewPanel | undefined;

export function createSettingsPanel(context: vscode.ExtensionContext): void {
    if (currentPanel) {
        currentPanel.reveal();
        return;
    }

    currentPanel = vscode.window.createWebviewPanel(
        'vscccSettings',
        'Theme Carousel Settings',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    function sendConfig() {
        const config = vscode.workspace.getConfiguration('vsccc');
        currentPanel?.webview.postMessage({
            type: 'update',
            config: {
                mode: config.get<string>('mode', 'daily'),
                dailyIntervalDays: config.get<number>('dailyIntervalDays', 1),
                timedMorningHour: config.get<number>('timedMorningHour', 8),
                timedAfternoonHour: config.get<number>('timedAfternoonHour', 13),
                timedEveningHour: config.get<number>('timedEveningHour', 18),
                recommendThemes: config.get<boolean>('recommendThemes', true),
                recommendIntervalDays: config.get<number>('recommendIntervalDays', 7),
                showStatusBarIcon: config.get<boolean>('showStatusBarIcon', true),
            },
        });
    }

    currentPanel.webview.html = getHtml();
    sendConfig();

    currentPanel.webview.onDidReceiveMessage(async (msg) => {
        const config = vscode.workspace.getConfiguration('vsccc');
        switch (msg.type) {
            case 'setSetting':
                await config.update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
                break;
            case 'switchTheme':
                await vscode.commands.executeCommand('vsccc.switchTheme');
                break;
            case 'recommendTheme':
                await vscode.commands.executeCommand('vsccc.recommendTheme');
                break;
        }
    }, undefined, context.subscriptions);

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('vsccc')) {
            sendConfig();
        }
    });

    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
        configListener.dispose();
    }, null, context.subscriptions);
}

function getHtml(): string {
    return /*html*/`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body {
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        padding: 20px 28px;
        max-width: 520px;
    }
    h1 {
        font-size: 1.4em;
        margin: 0 0 4px 0;
        font-weight: 600;
    }
    .subtitle {
        color: var(--vscode-descriptionForeground);
        margin-bottom: 20px;
        font-size: 0.9em;
    }
    .section {
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #444));
        border-radius: 6px;
        padding: 14px 16px;
        margin-bottom: 14px;
    }
    .section-title {
        font-weight: 600;
        font-size: 0.95em;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
    }
    .field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }
    .field:last-child { margin-bottom: 0; }
    .field label {
        flex: 1;
    }
    .field-desc {
        font-size: 0.85em;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }
    select, input[type="number"] {
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, #444);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.95em;
        min-width: 80px;
    }
    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--vscode-focusBorder);
    }
    .actions {
        display: flex;
        gap: 10px;
    }
    button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 0.95em;
        flex: 1;
    }
    button:hover {
        background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    .hidden { display: none; }
</style>
</head>
<body>
    <h1>Theme Carousel Settings</h1>
    <p class="subtitle">Configure automatic theme switching</p>

    <div class="section">
        <div class="section-title">Schedule</div>
        <div class="field">
            <label>Mode</label>
            <select id="mode">
                <option value="daily">Daily</option>
                <option value="timed">Timed (3x/day)</option>
            </select>
        </div>
    </div>

    <div class="section" id="daily-section">
        <div class="section-title">Daily Settings</div>
        <div class="field">
            <label>Switch every N day(s)</label>
            <input type="number" id="dailyIntervalDays" min="1" step="1">
        </div>
    </div>

    <div class="section hidden" id="timed-section">
        <div class="section-title">Timed Settings</div>
        <div class="field">
            <label>Morning hour (0-23)</label>
            <input type="number" id="timedMorningHour" min="0" max="23" step="1">
        </div>
        <div class="field">
            <label>Afternoon hour (0-23)</label>
            <input type="number" id="timedAfternoonHour" min="0" max="23" step="1">
        </div>
        <div class="field">
            <label>Evening hour (0-23)</label>
            <input type="number" id="timedEveningHour" min="0" max="23" step="1">
        </div>
    </div>

    <div class="section">
        <div class="section-title">Recommendations</div>
        <div class="field">
            <label>Enable recommendations</label>
            <input type="checkbox" id="recommendThemes">
        </div>
        <div class="field">
            <label>Recommend every N day(s)</label>
            <input type="number" id="recommendIntervalDays" min="1" step="1">
        </div>
    </div>

    <div class="section">
        <div class="section-title">Appearance</div>
        <div class="field">
            <label>Show status bar icon</label>
            <input type="checkbox" id="showStatusBarIcon">
        </div>
    </div>

    <div class="section">
        <div class="section-title">Actions</div>
        <div class="actions">
            <button id="btn-switch">Switch Theme Now</button>
            <button id="btn-recommend" class="secondary">Recommend a Theme</button>
        </div>
    </div>

<script>
    const vscode = acquireVsCodeApi();

    const els = {
        mode: document.getElementById('mode'),
        dailyIntervalDays: document.getElementById('dailyIntervalDays'),
        timedMorningHour: document.getElementById('timedMorningHour'),
        timedAfternoonHour: document.getElementById('timedAfternoonHour'),
        timedEveningHour: document.getElementById('timedEveningHour'),
        recommendThemes: document.getElementById('recommendThemes'),
        recommendIntervalDays: document.getElementById('recommendIntervalDays'),
        showStatusBarIcon: document.getElementById('showStatusBarIcon'),
    };

    const dailySection = document.getElementById('daily-section');
    const timedSection = document.getElementById('timed-section');

    function toggleSections(mode) {
        dailySection.classList.toggle('hidden', mode !== 'daily');
        timedSection.classList.toggle('hidden', mode !== 'timed');
    }

    // Receive config from extension host
    window.addEventListener('message', e => {
        if (e.data.type === 'update') {
            const c = e.data.config;
            els.mode.value = c.mode;
            els.dailyIntervalDays.value = c.dailyIntervalDays;
            els.timedMorningHour.value = c.timedMorningHour;
            els.timedAfternoonHour.value = c.timedAfternoonHour;
            els.timedEveningHour.value = c.timedEveningHour;
            els.recommendThemes.checked = c.recommendThemes;
            els.recommendIntervalDays.value = c.recommendIntervalDays;
            els.showStatusBarIcon.checked = c.showStatusBarIcon;
            toggleSections(c.mode);
        }
    });

    // Send changes to extension host
    function send(key, value) {
        vscode.postMessage({ type: 'setSetting', key, value });
    }

    els.mode.addEventListener('change', () => {
        send('mode', els.mode.value);
        toggleSections(els.mode.value);
    });

    for (const key of ['dailyIntervalDays', 'timedMorningHour', 'timedAfternoonHour', 'timedEveningHour', 'recommendIntervalDays']) {
        els[key].addEventListener('change', () => {
            const v = parseInt(els[key].value, 10);
            if (!isNaN(v)) { send(key, v); }
        });
    }

    els.recommendThemes.addEventListener('change', () => {
        send('recommendThemes', els.recommendThemes.checked);
    });

    els.showStatusBarIcon.addEventListener('change', () => {
        send('showStatusBarIcon', els.showStatusBarIcon.checked);
    });

    document.getElementById('btn-switch').addEventListener('click', () => {
        vscode.postMessage({ type: 'switchTheme' });
    });

    document.getElementById('btn-recommend').addEventListener('click', () => {
        vscode.postMessage({ type: 'recommendTheme' });
    });
</script>
</body>
</html>`;
}
