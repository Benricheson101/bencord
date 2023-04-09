import '@types/node';

declare global {
  export interface Window {
    Bencord: typeof import('bencord').default;
  }
}
