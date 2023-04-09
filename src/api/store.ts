import {waitForLoad} from './patch';
import {getByName} from './webpack';

export const stores: ReturnType<typeof _getStores<false>> = {};

waitForLoad<{[key: string]: any}>(
  e => Object.values(e).some(m => m?.Store),
  a => {
    // TODO: do this without a timeout
    // the issue is that Store.getAll() depends on other modulse in the chunk,
    // which are not yet loaded (not `push` ed). this somehow needs to wait until
    // after push() runs. check out wprequire.O or chunk[2] maybe?
    setTimeout(() => {
      const store = Object.values(a.exports).find(s => s?.Store);
      _getStores(store.Store, false, stores);
    }, 300);
  }
);

export type GenericStore<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  getName(): string;
} & T;

export interface Store {
  getAll(): GenericStore[];
}

export const getStores = <C extends boolean = true>(combineDuplicates?: C) =>
  _getStores<C>(getByName<Store>('Store')!, combineDuplicates);

export const _getStores = <
  C extends boolean = true,
  T extends Record<
    string,
    C extends true ? GenericStore | GenericStore[] : GenericStore
  > = Record<
    string,
    C extends true ? GenericStore | GenericStore[] : GenericStore
  >
>(
  combineDuplicates?: C,
  into = {} as T
) =>
  getByName<Store>('Store')!
    .getAll()
    .reduce((a, c) => {
      const name = c.getName() as keyof T;

      // TODO: how do I make these types nicer?
      if (name in a && combineDuplicates) {
        if (!Array.isArray(a[name])) {
          (a as any)[name] = [a[name] as GenericStore];
        }

        a[name];
      } else {
        (a as any)[name] = c;
      }

      return a;
    }, into);
