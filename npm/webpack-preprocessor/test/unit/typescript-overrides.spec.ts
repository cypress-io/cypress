import { expect, it, describe, beforeEach, vi, Mock } from 'vitest'
import { getTypescript } from '../../lib/get-typescript'
import { CreateProgramOptions } from 'typescript'

type Typescript = {
  createProgram: Mock
  version: string
}

vi.mock('../../lib/get-typescript', () => {
  return {
    getTypescript: vi.fn(),
  }
})

let createProgram: Typescript['createProgram']

describe('./lib/typescript-overrides', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('TypeScript v5', () => {
    beforeEach(() => {
      createProgram = vi.fn()

      vi.mocked(getTypescript).mockReturnValue({
        version: '5.4.5',
        createProgram,
      } as unknown as typeof import('typescript'))
    })

    describe('.overrideSourceMaps', () => {
      it('does not call createProgram on TypeScript v5 as it is an ESM wither getter accessors only', async () => {
        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        overrideSourceMaps(true)

        expect(vi.mocked(getTypescript).mock.results[0].value.createProgram).not.toHaveBeenCalled()
      })
    })
  })

  describe('TypeScript v4', () => {
    let mockedTypescript: typeof import('typescript')

    beforeEach(() => {
      mockedTypescript = {
        version: '4.5.0',
        createProgram: vi.fn(),
      } as unknown as typeof import('typescript')

      vi.mocked(getTypescript).mockReturnValue(mockedTypescript)
    })

    describe('.overrideSourceMaps', () => {
      it('it sets sourceMap: true', async () => {
        // Save the original createProgram function as we are going to override it
        const originalCreateProgram = mockedTypescript.createProgram

        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        overrideSourceMaps(true)

        mockedTypescript.createProgram({
          options: {
            sourceMap: false,
            inlineSources: true,
            inlineSourceMap: true,
          },
        } as CreateProgramOptions)

        expect(originalCreateProgram).toHaveBeenCalledWith({
          options: {
            sourceMap: true,
          },
        })
      })

      it('it sets sourceMap: false', async () => {
        // Save the original createProgram function as we are going to override it
        const originalCreateProgram = mockedTypescript.createProgram

        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        overrideSourceMaps(false)

        mockedTypescript.createProgram({
          options: {
            sourceMap: true,
            inlineSources: true,
            inlineSourceMap: true,
          },
        } as CreateProgramOptions)

        expect(originalCreateProgram).toHaveBeenCalledWith({
          options: {
            sourceMap: false,
          },
        })
      })

      it('sets options when given an array', async () => {
        // Save the original createProgram function as we are going to override it
        const originalCreateProgram = mockedTypescript.createProgram

        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        overrideSourceMaps(true)

        mockedTypescript.createProgram([], {
          sourceMap: false,
          inlineSources: true,
          inlineSourceMap: true,
        })

        expect(originalCreateProgram).toHaveBeenCalledWith([], {
          sourceMap: true,
        })
      })

      it('does not run twice', async () => {
        // Save the original createProgram function as we are going to override it
        const originalCreateProgram = mockedTypescript.createProgram

        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        overrideSourceMaps(true)

        mockedTypescript.createProgram([], {
          sourceMap: false,
          inlineSources: true,
          inlineSourceMap: true,
        })

        expect(originalCreateProgram).toHaveBeenCalledOnce()

        overrideSourceMaps(true)

        // result will be the error if it tries to require typescript again
        expect(originalCreateProgram).toHaveBeenCalledOnce()
      })

      it('gracefully returns error when typescript cannot be required', async () => {
        const { getTypescript: actualGetTypescript } = (await vi.importActual<typeof import('../../lib/get-typescript')>('../../lib/get-typescript'))

        vi.mocked(getTypescript).mockImplementation(actualGetTypescript)

        const { overrideSourceMaps } = await import('../../lib/typescript-overrides')

        const err = overrideSourceMaps(true, 'nonexistent/typescript.js')

        expect(err).toBeInstanceOf(Error)
        expect(err.message).toMatch(/Cannot find module 'nonexistent\/typescript\.js'/)
      })
    })
  })
})
