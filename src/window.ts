import path from 'node:path';

import electron, {BrowserWindowConstructorOptions} from 'electron';

import {BencordWebContents, BencordWebPreferences} from './types';

export class BrowserWindow extends electron.BrowserWindow {
  constructor(
    options: BrowserWindowConstructorOptions & {
      webPreferences: BencordWebPreferences;
    }
  ) {
    if (
      options.webPreferences?.nativeWindowOpen &&
      options?.webPreferences?.preload
    ) {
      const originalPreload = options.webPreferences.preload;

      options.webPreferences.preload = path.join(__dirname, 'preload.js');

      const ops: BrowserWindowConstructorOptions = {
        ...options,
        webPreferences: {
          ...options.webPreferences,
          contextIsolation: false,
          sandbox: false,
          preload: path.join(__dirname, 'preload.js'),
        },
      };

      super(ops);

      (this.webContents as BencordWebContents).originalPreload =
        originalPreload;

      this.webContents.openDevTools();
    } else {
      super(options);
    }
  }
}

export const patchBrowserWindow = () => {
  Object.assign(BrowserWindow, electron.BrowserWindow);
  Object.defineProperty(BrowserWindow, 'name', {
    value: 'BrowserWindow',
    configurable: true,
  });

  const electronPath = require.resolve('electron');
  delete require.cache[electronPath]!.exports;
  require.cache[electronPath]!.exports = {
    ...electron,
    BrowserWindow,
  };
};
