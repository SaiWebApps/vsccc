import * as vscode from 'vscode';
import * as https from 'https';

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

interface MarketplaceTheme {
    extensionId: string;
    displayName: string;
    publisherName: string;
    installs: number;
}

function postJson(url: string, body: object): Promise<string> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const parsed = new URL(url);
        const options: https.RequestOptions = {
            hostname: parsed.hostname,
            path: parsed.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json;api-version=3.0-preview.1',
                'Content-Length': Buffer.byteLength(data),
            },
        };
        const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks).toString()));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

export async function fetchTrendingThemes(count: number = 50): Promise<MarketplaceTheme[]> {
    const body = {
        filters: [{
            pageNumber: 1,
            pageSize: count,
            criteria: [
                { filterType: 5, value: 'Themes' },
                { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
                { filterType: 12, value: '37888' },
            ],
        }],
        assetTypes: [],
        flags: 896,
    };

    const raw = await postJson(MARKETPLACE_URL, body);
    const json = JSON.parse(raw);
    const extensions = json?.results?.[0]?.extensions;
    if (!Array.isArray(extensions)) {
        return [];
    }

    return extensions.map((ext: any) => {
        const stats = ext.statistics || [];
        const installStat = stats.find((s: any) => s.statisticName === 'install');
        return {
            extensionId: `${ext.publisher?.publisherName}.${ext.extensionName}`,
            displayName: ext.displayName || ext.extensionName,
            publisherName: ext.publisher?.publisherName || 'unknown',
            installs: installStat?.value || 0,
        };
    });
}

function getInstalledExtensionIds(): Set<string> {
    const ids = new Set<string>();
    for (const ext of vscode.extensions.all) {
        ids.add(ext.id.toLowerCase());
    }
    return ids;
}

export async function showRecommendation(context: vscode.ExtensionContext): Promise<void> {
    try {
        const themes = await fetchTrendingThemes(50);
        const installed = getInstalledExtensionIds();

        // Filter out already-installed themes
        const candidates = themes.filter(t => !installed.has(t.extensionId.toLowerCase()));
        if (candidates.length === 0) {
            return;
        }

        // Pick a random one from the candidates
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const installCount = pick.installs >= 1000
            ? `${Math.floor(pick.installs / 1000)}k`
            : String(pick.installs);

        const action = await vscode.window.showInformationMessage(
            `Theme Carousel recommends: "${pick.displayName}" by ${pick.publisherName} (${installCount} installs)`,
            'Install',
            'Dismiss'
        );

        if (action === 'Install') {
            await vscode.commands.executeCommand(
                'workbench.extensions.search',
                pick.extensionId
            );
        }

        await context.globalState.update('vsccc.lastRecommendTimestamp', Date.now());
    } catch {
        // Network failure — silently skip, will retry next cycle
    }
}
