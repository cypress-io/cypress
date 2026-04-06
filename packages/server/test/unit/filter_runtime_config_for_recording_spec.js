require('../spec_helper')

const _ = require('lodash')
const { filterRuntimeConfigForRecording } = require('../../lib/config')
const { getCloudRecordingConfigKeys } = require('@packages/config')

describe('lib/config filterRuntimeConfigForRecording', () => {
  it('returns an empty object for an empty config', () => {
    expect(filterRuntimeConfigForRecording({})).to.eql({})
  })

  it('removes rawJson, resolved, and keys not in the cloud recording allowlist', () => {
    const filtered = filterRuntimeConfigForRecording({
      projectId: 'abc',
      baseUrl: 'http://localhost',
      rawJson: { huge: 'x'.repeat(1000) },
      resolved: { baseUrl: { value: 'x', from: 'config' } },
      socketId: 'sock-1',
      clientRoute: '/__/',
      arbitraryUserKey: { nested: true },
    })

    expect(filtered.rawJson).to.be.undefined
    expect(filtered.resolved).to.be.undefined
    expect(filtered.socketId).to.be.undefined
    expect(filtered.clientRoute).to.be.undefined
    expect(filtered.arbitraryUserKey).to.be.undefined
    expect(filtered.projectId).to.eq('abc')
    expect(filtered.baseUrl).to.eq('http://localhost')
  })

  it('replaces env values with type placeholders', () => {
    const filtered = filterRuntimeConfigForRecording({
      env: {
        STR: 'secret',
        NUM: 42,
        BOOL: false,
        OBJ: { a: 1 },
      },
    })

    expect(filtered.env).to.eql({
      STR: 'omitted: string',
      NUM: 'omitted: number',
      BOOL: 'omitted: boolean',
      OBJ: 'omitted: object',
    })
  })

  it('replaces expose values with type placeholders like env', () => {
    const filtered = filterRuntimeConfigForRecording({
      expose: {
        API_URL: 'https://secret.example',
        FLAG: true,
      },
    })

    expect(filtered.expose).to.eql({
      API_URL: 'omitted: string',
      FLAG: 'omitted: boolean',
    })
  })

  it('omits devServer webpackConfig and viteConfig but keeps other devServer fields', () => {
    const filtered = filterRuntimeConfigForRecording({
      devServer: {
        bundler: 'webpack',
        framework: 'react',
        webpackConfig: { entry: 'app' },
        viteConfig: { root: '/tmp' },
      },
    })

    expect(filtered.devServer).to.eql({
      bundler: 'webpack',
      framework: 'react',
      webpackConfig: 'omitted',
      viteConfig: 'omitted',
    })
  })

  it('preserves bundler and framework on devServerConfig and redacts other fields', () => {
    const filtered = filterRuntimeConfigForRecording({
      devServerConfig: {
        bundler: 'vite',
        framework: 'vue',
        viteConfig: { build: { target: 'esnext' } },
        mode: 'development',
      },
    })

    expect(filtered.devServerConfig).to.eql({
      bundler: 'vite',
      framework: 'vue',
      viteConfig: 'omitted: object',
      mode: 'omitted: string',
    })
  })

  it('redacts non-object devServerConfig with a type placeholder string', () => {
    expect(filterRuntimeConfigForRecording({ devServerConfig: null }).devServerConfig)
    .to.eq('omitted: object')

    expect(filterRuntimeConfigForRecording({ devServerConfig: 'oops' }).devServerConfig)
    .to.eq('omitted: string')

    expect(filterRuntimeConfigForRecording({ devServerConfig: [] }).devServerConfig)
    .to.eq('omitted: object')
  })

  it('does not set devServerConfig when undefined', () => {
    const filtered = filterRuntimeConfigForRecording({ projectId: 'x' })

    expect(filtered).not.to.have.property('devServerConfig')
  })

  it('keeps indexHtmlFile and allowlisted public keys only', () => {
    const filtered = filterRuntimeConfigForRecording({
      indexHtmlFile: 'cypress/support/component-index.html',
      specPattern: '**/*.cy.ts',
      video: true,
      notARealOption: 'drop-me',
    })

    expect(filtered.indexHtmlFile).to.eq('cypress/support/component-index.html')
    expect(filtered.specPattern).to.eq('**/*.cy.ts')
    expect(filtered.video).to.eq(true)
    expect(filtered.notARealOption).to.be.undefined
  })

  it('output keys are a subset of getCloudRecordingConfigKeys()', () => {
    const allow = new Set(getCloudRecordingConfigKeys())
    const filtered = filterRuntimeConfigForRecording({
      projectId: 'p',
      devServer: { bundler: 'webpack', framework: 'react' },
      devServerConfig: { bundler: 'webpack', framework: 'react' },
      env: { K: 1 },
      expose: { X: 'y' },
      indexHtmlFile: 'index.html',
      extra: 'should-not-appear',
    })

    _.each(_.keys(filtered), (key) => {
      expect(allow.has(key), `unexpected key on filtered config: ${key}`).to.equal(true)
    })
  })
})
