import * as objUtils from '../../../lib/util/obj_utils'
import { expect } from 'chai'

const { each, remapKeys, renameKey, setValue, remove } = objUtils

describe('obj_utils', () => {
  context('#remapKeys', () => {
    it('can rename, remove, and set values', () => {
      const initial = {
        foos: [{ id: 1, renameMe: 'foo' }, { id: 2, renameMe: 'bar' }, { id: 3, renameMe: 'baz' }],
        foos2: [{ id: 1, renameMe: 'foo' }, { id: 2, renameMe: 'bar' }, { id: 3, renameMe: 'baz' }],
        bar: 'foobar',
      }

      remapKeys(initial, {
        foos: each((foo, i) => ({ renameMe: renameKey('newName'), id: setValue(i) })),
        foos2: each({ renameMe: remove }),
        bar: remove,
      })

      expect(initial).deep.eq({
        foos: [{ id: 0, newName: 'foo' }, { id: 1, newName: 'bar' }, { id: 2, newName: 'baz' }],
        foos2: [{ id: 1 }, { id: 2 }, { id: 3 }],
      })
    })
  })
})
