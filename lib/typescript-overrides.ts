const debug = require('debug')('cypress:webpack')

let sourceMapOverride: null | boolean = null

export const tryRequireTypescript = () => {
  try {
    // reset each time this is called
    sourceMapOverride = null

    const typescript = require('typescript')

    debug('typescript found, overriding typescript.createProgram()')

    const { createProgram } = typescript

    typescript.createProgram = (...args: [any]) => {
      const [programOptions] = args
      const { options } = programOptions

      debug('typescript unmodified createProgram options %o', options)

      // if sourceMap has been set then apply
      // these overrides to force typescript
      // to generate the right sourcemaps
      if (sourceMapOverride !== null) {
        options.sourceMap = sourceMapOverride

        delete options.inlineSources
        delete options.inlineSourceMap

        debug('typescript modified createProgram options %o', options)
      }

      return createProgram.apply(typescript, args)
    }

    return typescript
  } catch (err) {
    debug('typescript not found')

    // for testing
    return err
  }
}

export const overrideSourceMaps = (val: boolean) => {
  sourceMapOverride = val
}

export const getSourceMapOverride = () => {
  return sourceMapOverride
}

tryRequireTypescript()
