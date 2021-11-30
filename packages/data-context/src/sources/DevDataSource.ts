import type { Patch } from 'immer'
import type { DataContext } from '..'
import type { DevStatePatchShape } from '../data'

export class DevDataSource {
  constructor (private ctx: DataContext, private _patches: Patch[][]) {}

  patches (afterIndex: number = 0) {
    return this._patches.slice(afterIndex + 2)
    .map((patches, i): DevStatePatchShape[] => patches.map((p) => ({ ...p, index: i })))
  }
}
