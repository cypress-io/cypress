declare module 'return-deep-diff' {
  /** Returns the keys whose values differ in `updated`, or `null` when nothing differs */
  export default function deepDiff (original: object, updated: object, keepNewKeys?: boolean): Record<string, any> | null
}
