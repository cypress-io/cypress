require('../spec_helper')

const spec = require(`${root}lib/controllers/spec`)
const preprocessor = require(`${root}lib/plugins/preprocessor`)

describe('lib/controllers/spec', () => {
  const specName = 'sample.js'
  const outputFilePath = 'foo/bar/sample.js'

  beforeEach(function () {
    this.project = {
      emit: sinon.spy(),
    }

    this.res = {
      set: sinon.spy(),
      type: sinon.spy(),
      send: sinon.spy(),
      sendFile: sinon.stub(),
    }

    sinon.stub(preprocessor, 'getFile').resolves(outputFilePath)
    this.onError = sinon.spy()

    this.handle = (filePath, config = {}) => {
      return spec.handle(filePath, {}, this.res, config, (() => {}), this.onError)
    }
  })

  it('sets the correct content type', function () {
    this.handle(specName)

    expect(this.res.type)
    .to.be.calledOnce
    .and.to.be.calledWith('js')
  })

  it('sends the file resolved from the preprocessor', function () {
    this.res.sendFile.yields()

    return this.handle(specName).then(() => {
      expect(this.res.sendFile).to.be.calledWith(outputFilePath)
    })
  })

  it('sends a client-side error in interactive mode', function () {
    preprocessor.getFile.rejects(new Error('Reason request failed'))

    return this.handle(specName).then(() => {
      expect(this.res.send).to.be.called
      expect(this.res.send.firstCall.args[0]).to.include('(function')
      expect(this.res.send.firstCall.args[0]).to.include('Reason request failed')
    })
  })

  it('calls onError callback in run mode', function () {
    preprocessor.getFile.rejects(new Error('Reason request failed'))

    return this.handle(specName, { isTextTerminal: true }).then(() => {
      expect(this.onError).to.be.called
      expect(this.onError.lastCall.args[0].message).to.include('Oops...we found an error preparing this test file')
      expect(this.onError.lastCall.args[0].message).to.include('Reason request failed')
    })
  })

  it('errors when sending file errors', function () {
    const sendFileErr = new Error('ENOENT')

    this.res.sendFile.yields(sendFileErr)

    return this.handle(specName).then(() => {
      expect(this.res.send.firstCall.args[0]).to.include('(function')
      expect(this.res.send.firstCall.args[0]).to.include('ENOENT')
    })
  })

  it('ignores ECONNABORTED errors', function () {
    const sendFileErr = new Error('ECONNABORTED')

    sendFileErr.code = 'ECONNABORTED'

    this.res.sendFile.yields(sendFileErr)

    return this.handle(specName) // should resolve, not error
  })

  it('ignores EPIPE errors', function () {
    const sendFileErr = new Error('EPIPE')

    sendFileErr.code = 'EPIPE'

    this.res.sendFile.yields(sendFileErr)

    return this.handle(specName) // should resolve, not error
  })
})
