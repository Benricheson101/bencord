import {WebpackModule} from '../types';

export type FilterFn<T> = (wpModule: WebpackModule<T>) => boolean;
export type Filter<T> = (...args: any[]) => FilterFn<T>;

export const Filters = {
  id:
    <T>(id: number) =>
    (mod: WebpackModule<T>) =>
      mod.id === id,

  props:
    <T>(...props: (string | number | symbol)[]) =>
    (mod: WebpackModule<T>) =>
      mod.exports &&
      typeof mod.exports === 'object' &&
      Object.values(mod.exports).some(
        v => v && typeof v === 'object' && props.every(p => p in v)
      ),

  code:
    <T>(code: string | RegExp) =>
    (mod: WebpackModule<T>) =>
      mod.exports &&
      typeof mod.exports === 'object' &&
      Object.values(mod.exports).some(v =>
        v && typeof v === 'function' && typeof code === 'string'
          ? v.toString().includes(code)
          : v.toString().match(code)
      ),
} satisfies Record<string, Filter<unknown>>;
