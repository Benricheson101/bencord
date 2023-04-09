import {ipcMain} from 'electron';
import {BencordWebContents} from './types';

export const startIPCListeners = () => {
  ipcMain.on(BencordIPCCommands.GetOriginalPreload, e => {
    const preloadFile = (e.sender as BencordWebContents).originalPreload;

    console.log('sending originalPreload');

    e.returnValue = preloadFile;
  });
};

export enum BencordIPCCommands {
  GetOriginalPreload = 'GET_ORIGINAL_PRELOAD',
}
