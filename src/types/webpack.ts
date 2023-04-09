// TODO: these generic types are basically meaningless. make them better lol

export type WebpackModule<T> = {
  id: number;
  loaded: boolean;
  exports: T;
};

export type WebpackExports<T = unknown> = T;

export type WebpackModuleFactoryFn<T = {}> = (
  wpModule: WebpackModule<T>,
  wpExports: WebpackExports<T>,
  wpRequire: WebpackRequire
) => void;

export type WebpackModuleCache<T = unknown> = {
  [id: number]: WebpackModule<T>;
};

export type WebpackModuleFactories<T = unknown> = {
  [id: number]: WebpackModuleFactoryFn<T>;
};

export type WebpackChunk<T = unknown> = readonly [
  cacheKeyIdk: (symbol | number)[],
  modules: WebpackModuleFactories<T>,
  callback: (wpRequire: WebpackRequire) => unknown
];

export type WebpackRequire<T = unknown> = {
  /** requireScope */
  '*': unknown;
  /** publicPath */
  p: string;
  /** entryModuleId */
  s: number;
  /** moduleCache */
  c: WebpackModuleCache<T>;
  /** moduleFactories */
  m: WebpackModuleFactories<T>;
  /** moduleFactoriesAddOnly */
  'm (add only)': unknown;
  /** ensureChunk */
  e: (chunkID: number) => Promise<unknown[]>;
  /** ensureChunkHandlers */
  f: unknown;
  /** ensureChunkIncludeEntries */
  'f (include entries)': unknown;
  /** prefetchChunk */
  E: unknown;
  /** prefetchChunkHandlers */
  F: unknown;
  /** preloadChunk */
  G: unknown;
  /** preloadChunkHandlers */
  H: unknown;
  /** definePropertyGetters */
  d: unknown;
  /** makeNamespaceObject */
  r: unknown;
  /** createFakeNamespaceObject */
  t: unknown;
  /** compatGetDefaultExport */
  n: <T = unknown>(moduleID: number) => T;
  /** harmonyModuleDecorator */
  hmd: unknown;
  /** nodeModuleDecorator */
  nmd: unknown;
  /** getFullHash */
  h: unknown;
  /** wasmInstances */
  w: unknown;
  /** instantiateWasm */
  v: unknown;
  /** uncaughtErrorHandler */
  oe: unknown;
  /** scriptNonce */
  nc: unknown;
  /** loadScript */
  l: unknown;
  /** createScript */
  ts: unknown;
  /** createScriptUrl */
  tu: unknown;
  /** getTrustedTypesPolicy */
  tt: unknown;
  /** chunkName */
  cn: unknown;
  /** runtimeId */
  j: unknown;
  /** getChunkScriptFilename */
  u: unknown;
  /** getChunkCssFilename */
  k: unknown;
  /** getChunkUpdateScriptFilename */
  hu: unknown;
  /** getChunkUpdateCssFilename */
  hk: unknown;
  /** startup */
  x: unknown;
  /** startupNoDefault */
  'x (no default handler)': unknown;
  /** startupOnlyAfter */
  'x (only after)': unknown;
  /** startupOnlyBefore */
  'x (only before)': unknown;
  /** startupEntrypoint */
  X: unknown;
  /** onChunksLoaded */
  O: unknown;
  /** externalInstallChunk */
  C: unknown;
  /** interceptModuleExecution */
  i: unknown;
  /** global */
  g: typeof global;
  /** shareScopeMap */
  S: unknown;
  /** initializeSharing */
  I: unknown;
  /** currentRemoteGetScope */
  R: unknown;
  /** getUpdateManifestFilename */
  hmrF: unknown;
  /** hmrDownloadManifest */
  hmrM: unknown;
  /** hmrDownloadUpdateHandlers */
  hmrC: unknown;
  /** hmrModuleData */
  hmrD: unknown;
  /** hmrInvalidateModuleHandlers */
  hmrI: unknown;
  /** hmrRuntimeStatePrefix */
  hmrS: unknown;
  /** amdDefine */
  amdD: unknown;
  /** amdOptions */
  amdO: unknown;
  /** system */
  System: unknown;
  /** hasOwnProperty */
  o: unknown;
  /** systemContext */
  y: unknown;
  /** baseURI */
  b: unknown;
  /** relativeUrl */
  U: unknown;
  /** asyncModule */
  a: unknown;
} & ((id: number) => any);

// export type WebpackChunk<T = unknown> = readonly [
//   cacheKeyIdk: (symbol | number)[],
//   modules: {[key: number]: WebpackModuleFactoryFn<T>},
//   callback: <F>(wpRequire: WebpackRequire) => F
// ];

export type GlobalWebpackChunks = {
  push<T extends WebpackChunk>(chunk: T): ReturnType<T[2]>;
} & Omit<WebpackChunk[], 'push'>;

// -- type guards --

export const isGlobalWebpackChunks = (w: unknown): w is GlobalWebpackChunks =>
  w !== null &&
  typeof w === 'object' &&
  'push' in w &&
  (w as {push: unknown}).push !== Array.prototype.push;
