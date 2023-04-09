import {readFileSync} from 'node:fs';
import path from 'node:path';

import {ipcRenderer, webFrame} from 'electron';

import {BencordIPCCommands} from './ipc';

if (location.protocol !== 'data:') {
  const preloadJS = readFileSync(path.join(__dirname, 'renderer.js'), 'utf-8');
  webFrame.executeJavaScript(preloadJS);
}

const preload = ipcRenderer.sendSync(BencordIPCCommands.GetOriginalPreload);
if (preload) {
  console.log('preload:', preload);
  require(preload);
}
