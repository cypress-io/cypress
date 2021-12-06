import type { Patch } from 'immer'
import type { DataContext } from '..'

export class DevDataSource {
  constructor (private ctx: DataContext, private _patches: Patch[][]) {}

  patches (afterIndex: number = 0, last?: number) {
    const toSlice = this._patches
    .map((patches, i) => {
      return {
        index: i,
        changes: patches,
      }
    })

    if (typeof last === 'number') {
      return toSlice.slice(-last)
    }

    return toSlice.slice(afterIndex)
  }
}
