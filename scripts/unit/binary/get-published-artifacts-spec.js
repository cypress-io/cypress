const getPublishedArtifactsModule = require('../../binary/get-published-artifacts')
const sinon = require('sinon')
const { expect } = require('chai')

const mockArtifacts = [
  { url: '/', path: '~/cypress/binary-url.json' },
  { url: '/', path: '~/cypress/npm-package-url.json' },
  { url: '/', path: '~/cypress/cypress.zip' },
  { url: '/', path: '~/cypress/cypress.tgz' },
]

describe('get-published-artifacts', () => {
  afterEach(() => {
    sinon.reset()
  })

  it('downloads artifacts', async () => {
    process.env.SHOULD_PERSIST_ARTIFACTS = true

    const getPipelineIdStub = sinon.stub(getPublishedArtifactsModule, 'getPipelineId').returns('abc123')
    const getWorkflowsStub = sinon.stub(getPublishedArtifactsModule, 'getWorkflows').returns([{ id: 'my-workflow', name: 'linux-x64', status: 'success' }])
    const getWorkflowJobsStub = sinon.stub(getPublishedArtifactsModule, 'getWorkflowJobs').returns([{ name: 'linux-amd-publish-binary', job_number: 2 }])
    const getJobArtifactsStub = sinon.stub(getPublishedArtifactsModule, 'getJobArtifacts').returns(mockArtifacts)
    const downloadArtifactStub = sinon.stub(getPublishedArtifactsModule, 'downloadArtifact')

    await getPublishedArtifactsModule.run(['--pipelineInfo', 'foo', '--platformKey', 'linux-x64'])

    expect(getPipelineIdStub).to.have.been.calledWith('foo')
    expect(getWorkflowsStub).to.have.been.calledWith('abc123')
    expect(getWorkflowJobsStub).to.have.been.calledWith('my-workflow')
    expect(getJobArtifactsStub).to.have.been.calledWith(2)
    expect(downloadArtifactStub.getCalls()).to.have.length(4)
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/binary-url.json')
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/npm-package-url.json')
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/cypress.zip')
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/cypress.tgz')
  })

  it('URLs are not fetched if SHOULD_PERSIST_ARTIFACTS is false', async () => {
    process.env.SHOULD_PERSIST_ARTIFACTS = ''

    const getPipelineIdStub = sinon.stub(getPublishedArtifactsModule, 'getPipelineId').returns('abc123')
    const getWorkflowsStub = sinon.stub(getPublishedArtifactsModule, 'getWorkflows').returns([{ id: 'my-workflow', name: 'linux-x64', status: 'success' }])
    const getWorkflowJobsStub = sinon.stub(getPublishedArtifactsModule, 'getWorkflowJobs').returns([{ name: 'publish-binary', job_number: 2 }])
    const getJobArtifactsStub = sinon.stub(getPublishedArtifactsModule, 'getJobArtifacts').returns(mockArtifacts)
    const downloadArtifactStub = sinon.stub(getPublishedArtifactsModule, 'downloadArtifact')

    await getPublishedArtifactsModule.run(['--pipelineInfo', 'foo'])

    expect(getPipelineIdStub).to.have.been.calledWith('foo')
    expect(getWorkflowsStub).to.have.been.calledWith('abc123')
    expect(getWorkflowJobsStub).to.have.been.calledWith('my-workflow')
    expect(getJobArtifactsStub).to.have.been.calledWith(2)
    expect(downloadArtifactStub.getCalls()).to.have.length(2)
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/cypress.zip')
    expect(downloadArtifactStub).to.have.been.calledWith('/', '~/cypress/cypress.tgz')
  })
})
