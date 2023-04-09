import {_initWebpack} from './api';

import {GlobalWebpackChunks, isGlobalWebpackChunks} from './types';

let chunks: GlobalWebpackChunks;

Object.defineProperty(window, 'webpackChunkdiscord_app', {
  get: () => chunks,
  set: (w: unknown) => {
    if (isGlobalWebpackChunks(w)) {
      _initWebpack(w);

      import('./api').then(b => {
        window.Bencord = b.default;
      });
    }

    chunks = w as GlobalWebpackChunks;
  },
  configurable: true,
});
