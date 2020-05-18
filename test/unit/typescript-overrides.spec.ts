const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noPreserveCache()

type Typescript = {
  createProgram: sinon.SinonStub
}

let typescript: Typescript
let createProgram: Typescript['createProgram']

import '../../lib/typescript-overrides'

describe('./lib/typescript-overrides', () => {
  beforeEach(() => {
    createProgram = sinon.stub()
    typescript = {
      createProgram,
    }
  })

  context('.getSourceMapOverride', () => {
    it('is null by default', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      expect(typescriptOverrides.getSourceMapOverride()).to.be.null
    })
  })

  context('.tryRequireTypescript', () => {
    it('gracefully returns error when typescript cannot be required', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript: null,
      })

      const err = typescriptOverrides.tryRequireTypescript()

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.eq(`Cannot find module 'typescript'`)
    })
  })

  context('.overrideSourceMaps', () => {
    it('it sets sourceMap: true', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      typescriptOverrides.overrideSourceMaps(true)

      expect(typescriptOverrides.getSourceMapOverride()).to.be.true

      typescript.createProgram({
        options: {
          sourceMap: false,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })

      expect(createProgram).to.be.calledOn(typescript)
      expect(createProgram).to.be.calledWith({
        options: {
          sourceMap: true,
        },
      })
    })

    it('it sets sourceMap: false', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      typescriptOverrides.overrideSourceMaps(false)

      expect(typescriptOverrides.getSourceMapOverride()).to.be.false

      typescript.createProgram({
        options: {
          sourceMap: true,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })

      expect(createProgram).to.be.calledOn(typescript)
      expect(createProgram).to.be.calledWith({
        options: {
          sourceMap: false,
        },
      })
    })

    it('does not override sourcemaps', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      expect(typescriptOverrides.getSourceMapOverride()).to.be.null

      typescript.createProgram({
        options: {
          sourceMap: true,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })

      expect(createProgram).to.be.calledOn(typescript)
      expect(createProgram).to.be.calledWith({
        options: {
          sourceMap: true,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })
    })
  })
})
