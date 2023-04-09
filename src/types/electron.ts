import {WebContents, WebPreferences} from 'electron';

export interface BencordWebPreferences extends WebPreferences {
  nativeWindowOpen?: boolean;
}

export interface BencordWebContents extends WebContents {
  originalPreload?: string;
}
