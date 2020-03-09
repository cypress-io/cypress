require('../../spec_helper')

const fs = require(`${root}../lib/util/fs`)
const scaffold = require(`${root}../lib/modes/init/scaffold`)

describe('/lib/modes/init', () => {
  describe('scaffold', () => {
    beforeEach(() => {
      sinon.stub(fs, 'writeFile').resolves()
    })

    describe('create', () => {
      it('generates cypress.json with empty object', () => {
        const projRoot = '/home/user/src/cypress'

        scaffold.create(projRoot, { config: {} })

        expect(fs.writeFile).to.be.calledWith(`${projRoot}/cypress.json`, '{}')
      })
    })
  })
})
