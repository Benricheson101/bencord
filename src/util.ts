type ValueOf<T> = T[keyof T];

export const PlatformMap = {
  Darwin: 'darwin',
  Win32: 'win32',
  Linux: 'linux',
} as const;

export type Platform = ValueOf<typeof PlatformMap>;

export const waitForDefine = <T>(
  target: any,
  prop: string,
  cb: (v: T) => void
) => {
  if (prop in target) {
    cb(target[prop]);
    return;
  }

  Object.defineProperty(target, prop, {
    set(v) {
      delete target[prop];
      target[prop] = v;
      cb(v);
    },
    enumerable: false,
    configurable: true,
  });

  return;
};
