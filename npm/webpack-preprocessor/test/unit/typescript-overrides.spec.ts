import * as sinon from 'sinon'
const { expect } = require('chai')
const proxyquire = require('proxyquire').noPreserveCache()

type Typescript = {
  createProgram: sinon.SinonStub
}

let typescript: Typescript
let createProgram: Typescript['createProgram']

describe('./lib/typescript-overrides', () => {
  beforeEach(() => {
    createProgram = sinon.stub()
    typescript = {
      createProgram,
    }
  })

  context('.overrideSourceMaps', () => {
    it('it sets sourceMap: true', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      typescriptOverrides.overrideSourceMaps(true)

      typescript.createProgram({
        options: {
          sourceMap: false,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })

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

      typescript.createProgram({
        options: {
          sourceMap: true,
          inlineSources: true,
          inlineSourceMap: true,
        },
      })

      expect(createProgram).to.be.calledWith({
        options: {
          sourceMap: false,
        },
      })
    })

    it('sets options when given an array', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      typescriptOverrides.overrideSourceMaps(true)

      typescript.createProgram([], {
        sourceMap: false,
        inlineSources: true,
        inlineSourceMap: true,
      })

      expect(createProgram).to.be.calledWith([], {
        sourceMap: true,
      })
    })

    it('require "default" typescript if typescript option not specified', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
      })

      typescriptOverrides.overrideSourceMaps(true)

      typescript.createProgram([], {
        sourceMap: false,
        inlineSources: true,
        inlineSourceMap: true,
      })

      expect(createProgram).to.be.calledOn(typescript)
    })

    it('requires typescript from typescript option if specified', () => {
      const userCreateProgram = sinon.stub()
      const userTypescript = {
        createProgram: userCreateProgram,
      }
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
        '/path/to/user/typescript': userTypescript,
      })

      typescriptOverrides.overrideSourceMaps(true, '/path/to/user/typescript')

      userTypescript.createProgram([], {
        sourceMap: false,
        inlineSources: true,
        inlineSourceMap: true,
      })

      expect(userCreateProgram).to.be.calledOn(userTypescript)
    })

    it('does not run twice', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript,
        '/path/to/user/typescript': null,
      })

      typescriptOverrides.overrideSourceMaps(true)

      typescript.createProgram([], {
        sourceMap: false,
        inlineSources: true,
        inlineSourceMap: true,
      })

      expect(createProgram).to.be.calledOn(typescript)

      const result = typescriptOverrides.overrideSourceMaps(true, '/path/to/user/typescript')

      // result will be the error if it tries to require typescript again
      expect(result).to.be.undefined
    })

    it('gracefully returns error when typescript cannot be required', () => {
      const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
        typescript: null,
      })

      const err = typescriptOverrides.overrideSourceMaps(true)

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.match(/Cannot find module '.*typescript\.js'/)
    })
  })
})
