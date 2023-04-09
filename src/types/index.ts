export type Writeable<T> = {-readonly [P in keyof T]: T[P]};

export * from './webpack';
export * from './electron';
