# Theme Carousel

A Visual Studio Code extension that automatically switches your color theme on a configurable schedule. Never get bored of looking at the same theme again.

## Features

### Automatic Theme Switching
Theme Carousel randomly selects from all installed color themes and applies them on a schedule. It maintains a **history of recently used themes** (half of your total installed themes) to ensure variety — you won't see the same theme twice until the carousel has worked through the pool.

### Two Scheduling Modes

**Daily Mode** (default)
- Switches your theme every N days (configurable, default: 1 day).
- Persists across VS Code restarts — won't re-trigger until the interval has actually elapsed.

**Timed Mode**
- Switches your theme 3 times a day: morning, afternoon, and evening.
- Each time slot's hour is independently configurable (defaults: 8:00, 13:00, 18:00).
- Each slot fires exactly once per calendar day — restarting VS Code mid-slot won't trigger a duplicate switch.

### Status Bar Integration
The current theme name is displayed in the status bar (bottom-right). Click it to open the settings panel. The status bar icon can be hidden via settings.

When the status bar is visible, theme switch notifications are suppressed — the status bar itself serves as the indicator. When hidden, standard VS Code notifications appear instead.

### Marketplace Theme Recommendations
Periodically discovers trending themes from the VS Code Marketplace that you don't already have installed, and suggests them via a notification with a one-click install action. Configurable interval (default: every 7 days). Can be disabled entirely.

### Dedicated Settings Panel
A built-in visual settings page — no need to dig through JSON. Open it via:
- Clicking the status bar item
- Command Palette: `Theme Carousel: Open Settings`

The panel shows all options organized into sections (Schedule, Daily, Timed, Recommendations, Appearance, Actions) with live two-way sync — changes made in the panel write immediately, and external setting changes update the panel in real time.

## Commands

| Command | Description |
|---|---|
| `Theme Carousel: Switch Theme Now` | Immediately switch to a random theme |
| `Theme Carousel: Recommend a Theme` | Get a trending theme suggestion from the Marketplace |
| `Theme Carousel: Open Settings` | Open the visual settings panel |

## Settings

All settings are under the `vsccc.*` namespace.

| Setting | Type | Default | Description |
|---|---|---|---|
| `vsccc.mode` | `"daily"` \| `"timed"` | `"daily"` | Scheduling mode |
| `vsccc.dailyIntervalDays` | number (>= 1) | `1` | Days between switches in daily mode |
| `vsccc.timedMorningHour` | number (0-23) | `8` | Morning switch hour in timed mode |
| `vsccc.timedAfternoonHour` | number (0-23) | `13` | Afternoon switch hour in timed mode |
| `vsccc.timedEveningHour` | number (0-23) | `18` | Evening switch hour in timed mode |
| `vsccc.recommendThemes` | boolean | `true` | Enable periodic Marketplace recommendations |
| `vsccc.recommendIntervalDays` | number (>= 1) | `7` | Days between recommendations |
| `vsccc.showStatusBarIcon` | boolean | `true` | Show the theme name in the status bar |

## Architecture

```
src/
├── extension.ts        Entry point, command registration, status bar
├── themeService.ts     Theme enumeration, random selection with history, apply
├── scheduler.ts        60-second interval checks for daily/timed/recommendation triggers
├── marketplace.ts      VS Code Marketplace API queries, recommendation notifications
└── settingsPanel.ts    Webview-based settings UI with bidirectional config sync
```

### How It Works

1. **Activation**: The extension activates via `onStartupFinished` to ensure all theme-contributing extensions are loaded first.
2. **Theme enumeration**: Iterates `vscode.extensions.all` and collects `contributes.themes[].label` from each extension's package manifest.
3. **Random selection with variety**: Maintains a FIFO history in `globalState` sized to half the total theme count. Candidates are filtered against this history, guaranteeing you cycle through at least half your themes before any repeat.
4. **Theme application**: Writes to `workbench.colorTheme` via `vscode.workspace.getConfiguration().update()` with `ConfigurationTarget.Global`.
5. **Scheduling**: A lightweight 60-second `setInterval` polls whether a switch is due based on timestamps and slot keys persisted in `globalState`.
6. **Marketplace integration**: POSTs to the public VS Code Gallery API (`extensionquery`), filters out already-installed extensions, and presents a random pick.

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

To test locally, press **F5** in VS Code to launch the Extension Development Host with the extension loaded.

## Requirements

- VS Code 1.85.0 or later
- At least 2 installed color themes (for switching to be meaningful)

## License

MIT
