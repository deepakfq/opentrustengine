import { Tray, Menu, nativeImage, Notification, app } from 'electron';
import path from 'path';
import { showSettingsWindow } from './main';

let tray: Tray | null = null;
let currentStatus: TrayStatus = TrayStatus.Disconnected;
let lastSyncLabel = 'Never';

export enum TrayStatus {
  Connected = 'connected',
  Syncing = 'syncing',
  Error = 'error',
  Disconnected = 'disconnected',
}

const STATUS_LABELS: Record<TrayStatus, string> = {
  [TrayStatus.Connected]: 'Connected to Tally',
  [TrayStatus.Syncing]: 'Syncing...',
  [TrayStatus.Error]: 'Error — check settings',
  [TrayStatus.Disconnected]: 'Disconnected',
};

const STATUS_COLORS: Record<TrayStatus, string> = {
  [TrayStatus.Connected]: '#22c55e',
  [TrayStatus.Syncing]: '#eab308',
  [TrayStatus.Error]: '#ef4444',
  [TrayStatus.Disconnected]: '#9ca3af',
};

function createStatusIcon(status: TrayStatus): nativeImage {
  // Create a simple 16x16 colored circle icon using a data URL
  const color = STATUS_COLORS[status];
  const size = 16;

  // Use nativeImage.createEmpty() as fallback — in production, load from assets
  // For now, create a minimal PNG programmatically
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" />
  </svg>`;

  // Electron's nativeImage doesn't support SVG directly, so use a data URI workaround
  // In production, use pre-rendered PNG icons from assets/
  try {
    const iconPath = path.join(__dirname, '..', 'assets', `tray-${status}.png`);
    return nativeImage.createFromPath(iconPath);
  } catch {
    return nativeImage.createEmpty();
  }
}

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: STATUS_LABELS[currentStatus],
      enabled: false,
      icon: createStatusIcon(currentStatus),
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => showSettingsWindow(),
    },
    {
      label: 'Sync Now',
      click: () => {
        const { BrowserWindow } = require('electron');
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.webContents.send('trigger-sync');
        }
      },
    },
    {
      label: `Last Sync: ${lastSyncLabel}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.exit(0);
      },
    },
  ]);
}

export function createTray(): void {
  const icon = createStatusIcon(TrayStatus.Disconnected);
  tray = new Tray(icon);
  tray.setToolTip('OpenTrustEngine Tally Agent — Disconnected');
  tray.setContextMenu(buildContextMenu());

  tray.on('double-click', () => {
    showSettingsWindow();
  });
}

export function updateTrayStatus(status: TrayStatus, syncTime?: Date): void {
  currentStatus = status;

  if (syncTime) {
    const minutes = Math.round((Date.now() - syncTime.getTime()) / 60000);
    lastSyncLabel = minutes < 1 ? 'Just now' : `${minutes} min ago`;
  }

  if (tray) {
    tray.setImage(createStatusIcon(status));
    tray.setToolTip(`OpenTrustEngine Tally Agent — ${STATUS_LABELS[status]}`);
    tray.setContextMenu(buildContextMenu());
  }
}

export function showSyncNotification(eventCount: number): void {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: 'OpenTrustEngine Tally Agent',
    body: `Synced ${eventCount} new trust event${eventCount !== 1 ? 's' : ''} from Tally.`,
    silent: true,
  });

  notification.show();
}
