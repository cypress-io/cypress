declare module 'fake-uuid' {
  /** A readable UUID that starts with `input` and is padded with `fill`. */
  function fakeUuid (input: number | string, fill?: number | string): string

  export = fakeUuid
}
