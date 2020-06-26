import '../spec_helper'
import sinon from 'sinon'
import { expect } from 'chai'
import cp, { ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import * as nodeOptions from '../../lib/util/node_options'
import mockedEnv from 'mocked-env'

describe('NODE_OPTIONS lib', function () {
  context('.forkWithCorrectOptions', function () {
    let fakeProc: EventEmitter
    let restoreEnv

    beforeEach(() => {
      restoreEnv = mockedEnv({
        NODE_OPTIONS: '',
        ORIGINAL_NODE_OPTIONS: '',
      })
    })

    afterEach(() => {
      restoreEnv()
    })

    it('modifies NODE_OPTIONS', function () {
      process.env.NODE_OPTIONS = 'foo'
      expect(process.env.NODE_OPTIONS).to.eq('foo')
      sinon.stub(cp, 'spawn').callsFake(() => {
        expect(process.env).to.include({
          NODE_OPTIONS: `${nodeOptions.NODE_OPTIONS} foo`,
          ORIGINAL_NODE_OPTIONS: 'foo',
        })

        return null as ChildProcess // types
      })
    })

    context('when exiting', function () {
      beforeEach(() => {
        fakeProc = new EventEmitter()

        sinon.stub(cp, 'spawn')
        .withArgs(process.execPath, sinon.match.any, { stdio: 'inherit' })
        .returns(fakeProc as ChildProcess)

        sinon.stub(process, 'exit')
      })

      it('propagates exit codes correctly', function () {
        nodeOptions.forkWithCorrectOptions()
        fakeProc.emit('exit', 123)
        expect(process.exit).to.be.calledWith(123)
      })

      // @see https://github.com/cypress-io/cypress/issues/7722
      it('propagates signals via a non-zero exit code', function () {
        nodeOptions.forkWithCorrectOptions()
        fakeProc.emit('exit', null, 'SIGKILL')
        expect(process.exit).to.be.calledWith(1)
      })
    })
  })
})
