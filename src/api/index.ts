// import * as common from './common';
import {stores} from './store';
import * as webpack from './webpack';

/** remove props prefixed with an underscore from an object */
const removeInternal = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('_')));

// default exports are exposed in the client under the
// Bencord namespace
export default {
  stores,
  // common: removeInternal(common),
  webpack: removeInternal(webpack),
};

export * from './webpack';
// export * from './common';
