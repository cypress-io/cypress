/**
 * @internal - gets rid of a type error in webpack-dev-middleware/types/index.d.ts so we don't need skipLibCheck
 */
declare module 'fs' {
  export type StatSyncFn = (path: PathLike, options?: StatOptions & { bigint?: false }) => Stats;
}