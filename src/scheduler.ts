import * as vscode from 'vscode';
import { applyRandomTheme } from './themeService';
import { showRecommendation } from './marketplace';
import { syncStatusBar, notifySwitch } from './extension';

const CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds
const MS_PER_DAY = 86_400_000;

let intervalId: ReturnType<typeof setInterval> | undefined;

function getConfig() {
    return vscode.workspace.getConfiguration('vsccc');
}

async function checkDaily(context: vscode.ExtensionContext): Promise<void> {
    const intervalDays = getConfig().get<number>('dailyIntervalDays', 1);
    const lastSwitch = context.globalState.get<number>('vsccc.lastSwitchTimestamp');
    const now = Date.now();

    if (lastSwitch === undefined || (now - lastSwitch) >= intervalDays * MS_PER_DAY) {
        const theme = await applyRandomTheme(context);
        if (theme) {
            await context.globalState.update('vsccc.lastSwitchTimestamp', now);
            syncStatusBar();
            notifySwitch(theme);
        }
    }
}

function getCurrentSlot(hour: number, morningHour: number, afternoonHour: number, eveningHour: number): string | null {
    if (hour >= eveningHour) {
        return 'evening';
    } else if (hour >= afternoonHour) {
        return 'afternoon';
    } else if (hour >= morningHour) {
        return 'morning';
    }
    return null; // Before first slot of the day
}

async function checkTimed(context: vscode.ExtensionContext): Promise<void> {
    const config = getConfig();
    const morningHour = config.get<number>('timedMorningHour', 8);
    const afternoonHour = config.get<number>('timedAfternoonHour', 13);
    const eveningHour = config.get<number>('timedEveningHour', 18);

    const now = new Date();
    const hour = now.getHours();
    const slot = getCurrentSlot(hour, morningHour, afternoonHour, eveningHour);

    if (!slot) {
        return; // Before the first slot, no switch
    }

    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const slotKey = `${dateStr}-${slot}`;
    const lastSlot = context.globalState.get<string>('vsccc.lastTimedSlot');

    if (slotKey !== lastSlot) {
        const theme = await applyRandomTheme(context);
        if (theme) {
            await context.globalState.update('vsccc.lastTimedSlot', slotKey);
            syncStatusBar();
            notifySwitch(theme);
        }
    }
}

async function tick(context: vscode.ExtensionContext): Promise<void> {
    const config = getConfig();
    const mode = config.get<string>('mode', 'daily');
    if (mode === 'daily') {
        await checkDaily(context);
    } else if (mode === 'timed') {
        await checkTimed(context);
    }

    // Check if a recommendation is due
    await checkRecommendation(context);
}

async function checkRecommendation(context: vscode.ExtensionContext): Promise<void> {
    const config = getConfig();
    if (!config.get<boolean>('recommendThemes', true)) {
        return;
    }
    const intervalDays = config.get<number>('recommendIntervalDays', 7);
    const lastRecommend = context.globalState.get<number>('vsccc.lastRecommendTimestamp');
    const now = Date.now();

    if (lastRecommend === undefined || (now - lastRecommend) >= intervalDays * MS_PER_DAY) {
        await showRecommendation(context);
    }
}

export function startScheduler(context: vscode.ExtensionContext): void {
    // Run immediately on start
    tick(context);

    // Then check periodically
    intervalId = setInterval(() => tick(context), CHECK_INTERVAL_MS);
    context.subscriptions.push({ dispose: () => clearInterval(intervalId) });
}

export function stopScheduler(): void {
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}
