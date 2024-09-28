import { toOS } from '../../../src/util'
import { expect } from 'chai'
import sinon from 'sinon'
import path from 'path'

describe('file', () => {
  describe('#toOS', () => {
    const posixPath = '/foo/bar/baz'

    it('should convert posix path to Windows path', () => {
      sinon.stub(path, 'sep').value('\\')

      expect(toOS(posixPath)).to.equal('\\foo\\bar\\baz')
    })

    it('should return the same path if OS path separator is posix', () => {
      sinon.stub(path, 'sep').value('/')

      expect(toOS(posixPath)).to.equal(posixPath)
    })

    afterEach(() => {
      sinon.restore()
    })
  })
})
