/* eslint-disable no-console */
require('../spec_helper')

const capture = require(`../../lib/capture`)

describe('lib/capture', () => {
  afterEach(() => {
    return capture.restore()
  })

  context('process.stdout.write', () => {
    beforeEach(function () {
      this.write = sinon.spy(process.stdout, 'write')
      this.captured = capture.stdout()
    })

    it('slurps up stdout', function () {
      console.log('foo')
      console.log('bar')
      process.stdout.write('baz')

      expect(this.captured.data).to.deep.eq([
        'foo\n',
        'bar\n',
        'baz',
      ])

      expect(this.captured.toString()).to.eq('foo\nbar\nbaz')

      // should still call through to write
      expect(this.write).to.be.calledWith('foo\n')
      expect(this.write).to.be.calledWith('bar\n')

      expect(this.write).to.be.calledWith('baz')
    })
  })

  context('process.log', () => {
    beforeEach(function () {
      this.log = process.log
      this.logStub = (process.log = sinon.stub())

      this.captured = capture.stdout()
    })

    afterEach(function () {
      process.log = this.log
    })

    it('slurps up logs', function () {
      process.log('foo\n')
      process.log('bar\n')

      expect(this.captured.data).to.deep.eq([
        'foo\n',
        'bar\n',
      ])

      expect(this.captured.toString()).to.eq('foo\nbar\n')

      // should still call through to write
      expect(this.logStub).to.be.calledWith('foo\n')

      expect(this.logStub).to.be.calledWith('bar\n')
    })
  })
})
