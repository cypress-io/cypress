require('../../spec_helper')

const verify = require(`${lib}/tasks/verify`)
const spawn = require(`${lib}/exec/spawn`)
const init = require(`${lib}/exec/init`)
const util = require(`${lib}/util`)

describe('exec init', () => {
  describe('.start', () => {
    beforeEach(() => {
      sinon.stub(util, 'isInstalledGlobally').returns(true)
      sinon.stub(verify, 'start').resolves()
      sinon.stub(spawn, 'start').resolves()
    })

    it('spawns with force', () => {
      return init.start({ force: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--force'])
      })
    })

    it('spawns with yes', () => {
      return init.start({ yes: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--force'])
      })
    })
  })
})
