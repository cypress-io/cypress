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

    it('spawns with no-fixtures', () => {
      return init.start({ noFixtures: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--no-fixtures'])
      })
    })

    it('spawns with fixtures-path', () => {
      return init.start({ fixturesPath: 'hello/world' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--fixtures-path', 'hello/world'])
      })
    })

    it('spawns with no-support', () => {
      return init.start({ noSupport: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--no-support'])
      })
    })

    it('spawns with support-path', () => {
      return init.start({ supportPath: 'hi/world' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--support-path', 'hi/world'])
      })
    })

    it('spawns with integration-path', () => {
      return init.start({ integrationPath: 'aloha/world' })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--integration-path', 'aloha/world'])
      })
    })

    it('spawns with no-video', () => {
      return init.start({ noVideo: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--no-video'])
      })
    })

    it('spawns with example', () => {
      return init.start({ example: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--example'])
      })
    })

    it('spawns with typescript', () => {
      return init.start({ typescript: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--typescript'])
      })
    })

    it('spawns with ts', () => {
      return init.start({ ts: true })
      .then(() => {
        expect(spawn.start).to.be.calledWith(['--init-project', '--typescript'])
      })
    })
  })
})
