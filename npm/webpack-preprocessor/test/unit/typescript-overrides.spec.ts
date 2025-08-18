import * as sinon from 'sinon'
const { expect } = require('chai')
const proxyquire = require('proxyquire').noPreserveCache()

type Typescript = {
  createProgram: sinon.SinonStub
  version: string
}

let typescript: Typescript
let createProgram: Typescript['createProgram']

describe('./lib/typescript-overrides', () => {
  describe('TypeScript v5', () => {
    beforeEach(() => {
      createProgram = sinon.stub()
      typescript = {
        createProgram,
        version: '5.4.5',
      }
    })

    context('.overrideSourceMaps', () => {
      it('does not call createProgram on TypeScript v5 as it is an ESM wither getter accessors only', () => {
        const typescriptOverrides = proxyquire('../../lib/typescript-overrides', {
          typescript,
        })

        typescriptOverrides.overrideSourceMaps(true)

        expect(createProgram).not.to.be.called
      })
    })
  })
})
