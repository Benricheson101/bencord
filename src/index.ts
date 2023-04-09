import electron, {app, WebContents} from 'electron';

import path from 'node:path';

import {startIPCListeners} from './ipc';
import {patchBrowserWindow} from './window';

patchBrowserWindow();
startIPCListeners();

const asar = path.join(path.dirname(require.main!.filename), '..', '_app.asar');
require.main!.filename = asar;
app.setPath('exe', asar);

// @ts-expect-error legacy electron
app.setAppPath(asar);

app.whenReady().then(() => {
  console.log('ready!!');

  electron.session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        'https://*/api/v*/science',
        'https://*/api/v*/metrics',
        'https://sentry.io/*',
      ],
    },
    (_, callback) => {
      callback({cancel: true});
    }
  );
});

require(require.main!.filename);
