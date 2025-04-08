require('../../spec_helper')
const os = require('os')
const osPath = require('ospath')
const path = require('path')

const AppData = require(`../../../lib/util/app_data`)

describe('lib/util/app_data', () => {
  context('#toHashName', () => {
    const projectRoot = '/foo/bar'

    it('starts with folder name', () => {
      const hash = AppData.toHashName(projectRoot)

      expect(hash).to.match(/^bar-/)
    })

    it('computed for given path', () => {
      const hash = AppData.toHashName(projectRoot)
      const expected = 'bar-1df481b1ec67d4d8bec721f521d4937d'

      expect(hash).to.equal(expected)
    })

    it('does not handle empty project path', () => {
      const tryWithoutPath = () => {
        return AppData.toHashName()
      }

      expect(tryWithoutPath).to.throw('Missing project path')
    })
  })

  context('#findCommonAncestor', () => {
    it('posix', () => {
      expect(AppData.findCommonAncestor('/a/b/c/d', '/a/b/c/d/')).to.equal('/a/b/c/d')
      expect(AppData.findCommonAncestor('/a/b/c', '/a/x/y')).to.equal('/a')
      expect(AppData.findCommonAncestor('/a/b/', '/a/b/')).to.equal('/a/b/')
      expect(AppData.findCommonAncestor('/a', '/a/b/c')).to.equal('/a')
      expect(AppData.findCommonAncestor('/a/b/c', '/a')).to.equal('/a')
    })

    it('win32', () => {
      sinon.stub(os, 'platform')
      os.platform.returns('win32')

      expect(AppData.findCommonAncestor('c:\\a\\b\\c\\d', 'c:\\a\\b\\c\\d\\')).to.equal('c:\\a\\b\\c\\d')
      expect(AppData.findCommonAncestor('c:\\a\\b\\c', 'c:\\a\\x\\y')).to.equal('c:\\a')
      expect(AppData.findCommonAncestor('c:\\a\\b\\', 'c:\\a\\b\\')).to.equal('c:\\a\\b\\')
      expect(AppData.findCommonAncestor('c:\\a\\b\\', 'd:\\a\\b\\')).to.equal('')
      expect(AppData.findCommonAncestor('c:\\a', 'c:\\a\\b\\c')).to.equal('c:\\a')
      expect(AppData.findCommonAncestor('c:\\a\\b\\c', 'c:\\a')).to.equal('c:\\a')
    })
  })

  context('#getBundledFilePath', () => {
    it('provides an absolute path to the bundled file', () => {
      const projectRoot = '/foo/bar'
      const expectedPrefix = 'bar-1df481b1ec67d4d8bec721f521d4937d'
      const imagePath = '/img/123.png'
      const result = AppData.getBundledFilePath(projectRoot, imagePath)

      expect(result).to.contain(expectedPrefix)
      expect(result).to.contain(imagePath)
    })

    // @see https://github.com/cypress-io/cypress/issues/8599
    describe('issue #8599: can find a path to bundle preprocessor files that live outside the project directory', () => {
      it('on windows', () => {
        // mock / stub out path and os variables as if we were on Windows
        sinon.stub(os, 'platform')
        sinon.stub(osPath, 'data')
        sinon.stub(path, 'basename')
        sinon.stub(path, 'dirname')
        sinon.stub(path, 'isAbsolute')
        sinon.stub(path, 'join')
        sinon.stub(path, 'parse')
        sinon.stub(path, 'normalize')

        os.platform.returns('win32')
        osPath.data.returns(`C:\\Users\\foo\\AppData\\Roaming`)

        path.basename.callsFake((...args) => path.win32.basename(...args))
        path.dirname.callsFake((...args) => path.win32.dirname(...args))
        path.isAbsolute.callsFake((...args) => path.win32.isAbsolute(...args))
        path.join.callsFake((...args) => path.win32.join(...args))
        path.parse.callsFake((...args) => path.win32.parse(...args))
        path.normalize.callsFake((...args) => path.win32.normalize(...args))
        const filePathNotInProjectDirectory = `C:\\Users\\foo\\project\\support\\index.js`

        const projectRoot = `C:\\Users\\foo\\project\\nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).to.equal(`C:\\Users\\foo\\AppData\\Roaming\\Cypress\\cy\\test\\projects\\nested-project-5ddfc54488859fd4a685e789cc5259c9\\bundles\\support\\index.js`)
      })

      it('on linux', () => {
        sinon.stub(os, 'platform')
        sinon.stub(osPath, 'data')

        os.platform.returns('linux')
        osPath.data.returns(`/Users/foo/.cache`)

        const filePathNotInProjectDirectory = `/Users/foo/project/support/index.js`
        const projectRoot = `/Users/foo/project/nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).to.equal(`/Users/foo/.cache/Cypress/cy/test/projects/nested-project-48bc0cf1ee4dff159065e8a5813d3c7f/bundles/support/index.js`)
      })

      it('on darwin/mac', () => {
        sinon.stub(os, 'platform')
        sinon.stub(osPath, 'data')

        os.platform.returns('linux')
        osPath.data.returns(`/Users/foo/Library/Caches`)

        const filePathNotInProjectDirectory = `/Users/foo/project/support/index.js`
        const projectRoot = `/Users/foo/project/nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).to.equal(`/Users/foo/Library/Caches/Cypress/cy/test/projects/nested-project-48bc0cf1ee4dff159065e8a5813d3c7f/bundles/support/index.js`)
      })
    })
  })
})
