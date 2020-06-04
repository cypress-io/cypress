require('../spec_helper')

const fs = require('fs')
const os = require('os')
const path = require('path')
const trash = require(`${root}lib/util/trash`)

const populateDirectories = function (basePath) {
  fs.mkdirSync(basePath)
  fs.mkdirSync(path.resolve(basePath, 'bar'))
  fs.mkdirSync(path.resolve(basePath, 'bar', 'baz'))

  fs.writeFileSync(path.resolve(basePath, 'a.txt'), '')
  fs.writeFileSync(path.resolve(basePath, 'bar', 'b.txt'), '')
  fs.writeFileSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'), '')

  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).to.be.true
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).to.be.true

  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).to.be.true
}

const expectDirectoriesExist = function (basePath) {
  expect(fs.existsSync(basePath)).to.be.true
  expect(fs.existsSync(path.resolve(basePath, 'a.txt'))).to.be.false
  expect(fs.existsSync(path.resolve(basePath, 'bar', 'b.txt'))).to.be.false

  expect(fs.existsSync(path.resolve(basePath, 'bar', 'baz', 'c.txt'))).to.be.false
}

describe('lib/util/trash', () => {
  context('.folder', () => {
    it('trashes contents of directory in non-Linux', () => {
      sinon.stub(os, 'platform').returns('darwin')
      const basePath = path.join('foo')

      populateDirectories(basePath)

      return trash.folder(basePath).then(() => {
        expectDirectoriesExist(basePath)

        return fs.rmdirSync(basePath)
      })
    })

    it('doesn\'t fail if directory is non-existent', () => {
      return trash.folder('bar')
      .tapCatch(() => {
        throw new Error('should not have errored')
      })
    })

    it('completely removes directory on Linux', () => {
      sinon.stub(os, 'platform').returns('linux')
      const basePath = path.join('foo')

      populateDirectories(basePath)

      return trash.folder(basePath).then(() => {
        expectDirectoriesExist(basePath)

        return fs.rmdirSync(basePath)
      })
    })
  })
})
