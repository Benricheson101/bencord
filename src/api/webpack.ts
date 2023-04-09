import {
  GlobalWebpackChunks,
  WebpackExports,
  WebpackModule,
  WebpackRequire,
} from '../types';

import {patchPush} from './patch';
import {Filters} from './util';

let wpRequire: WebpackRequire;

export const _initWebpack = (w: GlobalWebpackChunks) => {
  console.log('_initWebpack push');
  wpRequire = w.push([[Symbol('owo')], {}, e => e]);

  patchPush(w);
};

// TODO: memoize these functions so they don't have to run unless needed

export const mods = <T = unknown>(): WebpackModule<T>[] =>
  Object.values((wpRequire as WebpackRequire<T>).c);

export const allExports = <T = {}>(): WebpackExports<T>[] =>
  mods().flatMap(c =>
    c.exports instanceof Object && c.exports.constructor.name === 'Object'
      ? Object.values({...c.exports} as WebpackExports<T> as {})
      : []
  );

export const find = <T = unknown>(
  ...args: Parameters<WebpackModule<T>[]['find']>
) => mods<T>().find(...args);
export const filter = <T = unknown>(
  ...args: Parameters<WebpackModule<T>[]['filter']>
) => mods<T>().filter(...args);
export const reduce = <T = unknown>(
  ...args: Parameters<WebpackModule<T>[]['reduce']>
) => mods<T>().reduce(...args);

export const findByID = <T>(id: number) => find<T>(Filters.id<T>(id));

export const findByProps = <T extends {}>(
  ...props: (string | number | symbol)[]
) => find<T>(Filters.props<T>(...props));

export const findExport = <T = unknown>(
  ...args: Parameters<WebpackExports<T>[]['find']>
) => allExports<T>().find(...args);
export const filterExports = <T = unknown>(
  ...args: Parameters<WebpackExports<T>[]['filter']>
) => allExports<T>().filter(...args);
export const reduceExports = <T = unknown>(
  ...args: Parameters<WebpackExports<T>[]['reduce']>
) => allExports<T>().reduce(...args);

export const getByName = <T>(name: string): T | undefined =>
  findExport<Record<string, T>>(e => e?.[name])?.[name];

export {Filters} from './util';
