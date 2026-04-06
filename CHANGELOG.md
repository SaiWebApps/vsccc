# Changelog

## 1.0.0 — 2026-04-06

Initial release.

### Features
- **Automatic theme switching** with two scheduling modes:
  - **Daily mode**: switch every N days (configurable)
  - **Timed mode**: switch 3 times a day at configurable morning, afternoon, and evening hours
- **Smart variety**: maintains a history of recently used themes (half of total installed) to prevent repetition
- **Manual switch**: "Theme Carousel: Switch Theme Now" command for on-demand switching
- **Marketplace recommendations**: periodic suggestions of trending themes you don't have installed, with one-click install
- **Status bar integration**: displays the current theme name; click to open settings
- **Dedicated settings panel**: visual webview UI with live two-way config sync
- 8 configurable settings (mode, daily interval, 3 timed hours, recommendations toggle + interval, status bar visibility)
