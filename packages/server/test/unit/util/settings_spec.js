require('../../spec_helper')
const { fs } = require(`../../../lib/util/fs`)
const setting = require(`../../../lib/util/settings`)

let readStub

describe('lib/util/settings', () => {
  describe('pathToConfigFile', () => {
    beforeEach(() => {
      readStub = sinon.stub(fs, 'readdirSync').returns(['cypress.json'])
    })

    it('supports relative path', () => {
      const path = setting.pathToConfigFile('/users/tony/cypress', {
        configFile: 'e2e/config.json',
      })

      expect(path).to.equal('/users/tony/cypress/e2e/config.json')
    })

    it('supports absolute path', () => {
      const path = setting.pathToConfigFile('/users/tony/cypress', {
        configFile: '/users/pepper/cypress/e2e/cypress.config.json',
      })

      expect(path).to.equal('/users/pepper/cypress/e2e/cypress.config.json')
    })

    it('errors if there is json & js', () => {
      readStub.returns(['cypress.json', 'cypress.config.js'])
      expect(() => setting.pathToConfigFile('/cypress')).to.throw('`cypress.config.js` and a `cypress.json`')
    })

    it('errors if there is ts & js', () => {
      readStub.returns(['cypress.config.ts', 'cypress.config.js'])
      expect(() => setting.pathToConfigFile('/cypress')).to.throw('`cypress.config.js` and a `cypress.config.ts`')
    })

    it('errors if all three are there', () => {
      readStub.returns(['cypress.config.ts', 'cypress.json', 'cypress.config.js'])
      expect(() => setting.pathToConfigFile('/cypress')).to.throw('`cypress.config.js` and a `cypress.config.ts`')
    })
  })
})
