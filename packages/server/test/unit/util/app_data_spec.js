require('../../spec_helper')

const AppData = require(`${root}../lib/util/app_data`)

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

  context('#getBundledFilePath', () => {
    it('provides an absolute path to the bundled file', () => {
      const projectRoot = '/foo/bar'
      const expectedPrefix = 'bar-1df481b1ec67d4d8bec721f521d4937d'
      const imagePath = '/img/123.png'
      const result = AppData.getBundledFilePath(projectRoot, imagePath)

      expect(result).to.contain(expectedPrefix)
      expect(result).to.contain(imagePath)
    })
  })
})
