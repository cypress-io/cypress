const debug = require('debug')('cypress:webpack')
const _ = require('lodash')

import { CompilerOptions, CreateProgramOptions } from 'typescript'

let patched = false

const getProgramOptions = (rootNamesOrOptions: CreateProgramOptions, options: CompilerOptions): CompilerOptions => {
  return _.isArray(rootNamesOrOptions) ? options : rootNamesOrOptions.options
}

export const overrideSourceMaps = (sourceMap: boolean, typescriptPath?: string) => {
  try {
    if (patched) {
      debug('typescript.createProgram() already overridden')

      return
    }

    const typescript = require(typescriptPath || 'typescript') as typeof import('typescript')
    const { createProgram } = typescript

    debug('typescript found, overriding typescript.createProgram()')

    typescript.createProgram = (...args: any[]) => {
      const [rootNamesOrOptions, _options] = args
      const options = getProgramOptions(rootNamesOrOptions, _options)

      debug('typescript unmodified createProgram options %o', options)

      // if sourceMap has been set then apply
      // these overrides to force typescript
      // to generate the right sourcemaps
      options.sourceMap = sourceMap

      delete options.inlineSources
      delete options.inlineSourceMap

      debug('typescript modified createProgram options %o', options)

      // @ts-ignore
      return createProgram.apply(typescript, args)
    }

    patched = true
  } catch (err) {
    debug('typescript not found')

    // for testing purposes
    return err
  }
}
