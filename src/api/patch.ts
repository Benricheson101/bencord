import {
  GlobalWebpackChunks,
  WebpackChunk,
  WebpackExports,
  WebpackModule,
  WebpackModuleFactoryFn,
  WebpackRequire,
  Writeable,
} from '../types';

export type Patch = {
  find?: string | RegExp;
  match?: string | RegExp;

  replace:
    | string
    | ((s: string) => string)
    | ((s: string, r: RegExpMatchArray) => string);

  _applied?: boolean;
};

export const patches = new Set<Patch>();

patches.add({
  match: /isDeveloper:\{configurable:!1,get:function\(\)\{(return \w)\}\}/,
  replace: (s: string, m: RegExpMatchArray) => s.replace(m[1], 'return true;'),
});

patches.add({
  match:
    /isStaff:\{writable:!1,configurable:!1,value:function\(\)\{return ((\w+)\.hasFlag\(([\w.$]+)\))\}\}/,
  replace: (s: string, m: RegExpMatchArray) => {
    const expr = m[1];
    const user = m[2];
    const flag = m[3];
    return s.replace(
      expr,
      `${user}.id === Bencord.stores?.UserStore?.getCurrentUser()?.id || ${user}.hasFlag(${flag})`
    );
  },
});

patches.add({
  match: "You haven't added a phone number yet.",
  replace: 'uwu',
});

patches.add({
  find: 'setDevtoolsCallbacks',
  match: /null==\w{0,3}\|\|"0\.0\.0"!==\w{0,3}\.remoteApp\.getVersion\(\)/,
  replace: 'false',
});

type ChunkLoadPredicateFn<T> = (e: WebpackExports<T>) => boolean;
type ChunkLoadedCallbackFn<T> = (
  m: WebpackModule<T>,
  e: WebpackExports<T>,
  r: WebpackRequire<T>
) => unknown;

const chunkLoadSubscriptions = new Map<
  ChunkLoadPredicateFn<any>,
  ChunkLoadedCallbackFn<any>
>();

export function waitForLoad<T>(
  pred: ChunkLoadPredicateFn<T>,
  callback: ChunkLoadedCallbackFn<T>
): void;
export function waitForLoad<T>(
  pred: ChunkLoadPredicateFn<T>
): Promise<WebpackExports<T>>;
export function waitForLoad<T>(
  pred: ChunkLoadPredicateFn<T>,
  callback?: ChunkLoadedCallbackFn<T>
): void | Promise<WebpackExports<T>> {
  if (callback && typeof callback === 'function') {
    chunkLoadSubscriptions.set(pred, callback);
  } else {
    return new Promise(resolve =>
      chunkLoadSubscriptions.set(pred, ((_, wpExports) =>
        resolve(wpExports)) as ChunkLoadedCallbackFn<T>)
    );
  }
}

const dispatchChunkLoadSubscriptions = (
  wpModule: WebpackModule<unknown>,
  wpExports: WebpackExports<unknown>,
  wpRequire: WebpackRequire<unknown>
) => {
  for (const [pred, cb] of chunkLoadSubscriptions) {
    if (pred(wpExports)) {
      chunkLoadSubscriptions.delete(pred);
      cb(wpModule, wpExports, wpRequire);
    }
  }
};

const patchModule = <T = unknown>(
  mod: WebpackModuleFactoryFn<T>
): WebpackModuleFactoryFn<T> => {
  const origMod = mod;
  const code = mod.toString();
  const patchedSrc = [...patches]
    .filter(p => !p._applied)
    .reduce((src, patch) => {
      let patched = src;

      const includesStringOrRegex = (s: string | RegExp): Boolean =>
        (typeof s === 'string' && src.includes(s)) ||
        (s instanceof RegExp && s.test(src));

      if (!patch.match && !patch.find) {
        throw new Error(
          `Error in patch: At least one of \`match\`, \`find\` must be present: ${patch}`
        );
      }

      if (
        !(
          (patch.find && includesStringOrRegex(patch.find)) ||
          (patch.match && includesStringOrRegex(patch.match))
        )
      ) {
        return src;
      }

      const doPatch = (p: Patch, m: string, matchArray?: RegExpMatchArray) => {
        if (typeof p.replace === 'function') {
          return p.replace(m, matchArray!);
        } else if (typeof p.replace === 'string') {
          return m.replace(m, p.replace);
        } else {
          throw new Error('Invalid Patch Type');
        }
      };

      const replace = (start: number, match: string, content: string) => {
        const before = patched.substring(0, start);
        const after = patched.substring(start + match.length);

        patched = before + content + after;
      };

      if (patch.match) {
        if (typeof patch.match === 'string') {
          let start = 0;

          // prevents accidental infinite loops
          let n = 0;

          while (
            (start = patched.indexOf(patch.match, start)) !== -1 &&
            n++ < 10_000
          ) {
            const match = patched.substring(start, start + patch.match.length);
            const patchedMatch = doPatch(patch, match);
            replace(start, match, patchedMatch);

            start += patchedMatch.length;
          }

          patch._applied = true;
        } else if (patch.match instanceof RegExp) {
          const matches = (
            patch.match.global
              ? [...patched.matchAll(patch.match)!]
              : [patched.match(patch.match)!]
          ).filter(Boolean);
          for (const match of matches) {
            const patchedMatch = doPatch(patch, match[0], match);
            replace(match.index!, match[0], patchedMatch);
          }

          patch._applied = true;
        }
      } else {
        patched = doPatch(patch, patched);
        patch._applied = true;
      }

      return patched;
    }, code);

  mod = patchedSrc === code ? mod : (0, eval)(patchedSrc);

  const factory: WebpackModuleFactoryFn<T> = (
    wpModule: WebpackModule<T>,
    wpExports: WebpackExports<T>,
    wpRequire: WebpackRequire
  ) => {
    try {
      mod(wpModule, wpExports, wpRequire);
    } catch (err) {
      if (mod === origMod) {
        console.error('Error thrown in unpatched module', err);
        throw err;
      }

      console.error('Error thrown in patched module:', err);

      origMod(wpModule, wpExports, wpRequire);
      return;
    }

    dispatchChunkLoadSubscriptions(wpModule, wpExports, wpRequire);
  };

  return factory;
};

export const patchPush = (chunks: GlobalWebpackChunks) => {
  let origPush = chunks.push;

  const push = (c: Writeable<WebpackChunk>) => {
    const mods = Object.entries(c[1])
      .map(([k, f]) => [Number(k), patchModule(f)] as const)
      .reduce((a, c) => ((a[c[0]] = c[1]), a), {} as (typeof c)[1]);

    c[1] = mods;

    const origPushReturn = origPush.call(chunks, c);
    return origPushReturn;
  };

  Object.defineProperty(chunks, 'push', {
    get: () => push,
    set: v => (origPush = v),
    configurable: true,
  });
};
