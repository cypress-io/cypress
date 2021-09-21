require('../../spec_helper')
const setting = require(`../../../lib/util/settings`)

describe('lib/util/settings', () => {
  describe('pathToConfigFile', () => {
    it('supports relative path', () => {
      return setting.pathToConfigFile('/users/tony/cypress', {
        configFile: 'e2e/config.json',
      }).then((path) => {
        expect(path).to.equal('/users/tony/cypress/e2e/config.json')
      })
    })

    it('supports absolute path', () => {
      return setting.pathToConfigFile('/users/tony/cypress', {
        configFile: '/users/pepper/cypress/e2e/cypress.config.json',
      }).then((path) => {
        expect(path).to.equal('/users/pepper/cypress/e2e/cypress.config.json')
      })
    })
  })
})
