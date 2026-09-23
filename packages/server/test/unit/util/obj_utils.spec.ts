import { describe, expect, it } from 'vitest'
import * as objUtils from '../../../lib/util/obj_utils'

const { each, remapKeys, renameKey, setValue, remove } = objUtils

describe('obj_utils', () => {
  describe('#remapKeys', () => {
    it('returns cloned object with renamed, removed, and modified key/values', () => {
      const initial = {
        foos: [{ id: 1, renameMe: 'foo' }, { id: 2, renameMe: 'bar' }, { id: 3, renameMe: 'baz' }],
        foos2: [{ id: 1, renameMe: 'foo' }, { id: 2, renameMe: 'bar' }, { id: 3, renameMe: 'baz' }],
        bar: 'foobar',
      }

      const result = remapKeys(initial, {
        foos: each((foo, i) => ({ renameMe: renameKey('newName'), id: setValue(i) })),
        foos2: each({ renameMe: remove }),
        bar: remove,
      })

      expect(result).toEqual({
        foos: [{ id: 0, newName: 'foo' }, { id: 1, newName: 'bar' }, { id: 2, newName: 'baz' }],
        foos2: [{ id: 1 }, { id: 2 }, { id: 3 }],
      })

      expect(result).not.toBe(initial)
    })
  })
})
