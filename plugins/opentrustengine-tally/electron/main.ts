import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createTray, updateTrayStatus, TrayStatus } from './tray';
import { TallyClient, TallyConfig } from '../src/tally/tally-client';
import { TallyPoller } from '../src/sync/poller';
import { mapVoucherToTrustEvent } from '../src/sync/mapper';
import { SyncState } from '../src/sync/state';

let mainWindow: BrowserWindow | null = null;
let poller: TallyPoller | null = null;
let tallyClient: TallyClient | null = null;
const syncState = new SyncState();

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 720,
    height: 560,
    show: false,
    title: 'OpenTrustEngine Tally Agent',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'src', 'ui', 'index.html'));

  win.on('close', (e) => {
    e.preventDefault();
    win.hide();
  });

  return win;
}

export function showSettingsWindow(): void {
  if (!mainWindow) {
    mainWindow = createWindow();
  }
  mainWindow.show();
  mainWindow.focus();
}

function initTallyClient(): void {
  const config = syncState.getConfig();
  const tallyConfig: TallyConfig = {
    host: config.tallyHost || 'localhost',
    port: config.tallyPort || 9000,
    company: config.tallyCompany || '',
  };

  tallyClient = new TallyClient(tallyConfig);
}

function startPoller(): void {
  if (poller) {
    poller.stop();
  }

  if (!tallyClient) {
    initTallyClient();
  }

  const config = syncState.getConfig();
  const intervalMs = (config.pollIntervalSeconds || 60) * 1000;

  poller = new TallyPoller(
    tallyClient!,
    async (vouchers) => {
      updateTrayStatus(TrayStatus.Syncing);

      let eventsSent = 0;
      for (const voucher of vouchers) {
        if (syncState.isVoucherProcessed(voucher.guid)) {
          continue;
        }

        const event = mapVoucherToTrustEvent(
          voucher,
          config.entityType || 'business',
          config.entityId || '',
        );

        if (event) {
          try {
            // TODO: Send event via OTE SDK
            // await oteClient.submitEvent(event);
            syncState.markVoucherProcessed(voucher.guid);
            eventsSent++;
          } catch (err) {
            syncState.logError(`Failed to send event for voucher ${voucher.voucherNumber}: ${err}`);
          }
        }
      }

      syncState.recordSync(eventsSent);
      updateTrayStatus(TrayStatus.Connected);
    },
    intervalMs,
  );

  poller.start();
  updateTrayStatus(TrayStatus.Connected);
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return syncState.getConfig();
});

ipcMain.handle('save-config', (_event, config) => {
  syncState.saveConfig(config);
  initTallyClient();
  if (config.autoStart) {
    startPoller();
  }
  return { success: true };
});

ipcMain.handle('get-status', async () => {
  const connected = tallyClient ? await tallyClient.isConnected() : false;
  return {
    tallyConnected: connected,
    lastSyncAt: syncState.getLastSyncAt(),
    totalEventsSent: syncState.getTotalEventsSent(),
    recentErrors: syncState.getRecentErrors(),
    isPolling: poller !== null,
  };
});

ipcMain.handle('sync-now', async () => {
  if (!poller) {
    return { success: false, error: 'Poller not started. Configure settings first.' };
  }
  try {
    updateTrayStatus(TrayStatus.Syncing);
    await poller.poll();
    updateTrayStatus(TrayStatus.Connected);
    return { success: true };
  } catch (err) {
    updateTrayStatus(TrayStatus.Error);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('get-event-log', () => {
  return syncState.getEventLog();
});

ipcMain.handle('test-connection', async (_event, config: { host: string; port: number; company: string }) => {
  const client = new TallyClient(config);
  try {
    const connected = await client.isConnected();
    if (connected) {
      const companies = await client.getCompanies();
      return { success: true, companies };
    }
    return { success: false, error: 'Could not connect to Tally' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// App lifecycle
app.whenReady().then(() => {
  mainWindow = createWindow();
  createTray();

  const config = syncState.getConfig();
  if (config.tallyCompany && config.autoStart) {
    initTallyClient();
    startPoller();
  } else {
    updateTrayStatus(TrayStatus.Disconnected);
    showSettingsWindow();
  }
});

app.on('window-all-closed', (e: Event) => {
  // Prevent app from quitting when windows are closed — keep running in tray
  e.preventDefault();
});

app.on('before-quit', () => {
  if (poller) {
    poller.stop();
  }
  mainWindow?.destroy();
});
