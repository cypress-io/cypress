import debugModule from 'debug'
import _ from 'lodash'
import semverLt from 'semver/functions/lt'

import { CompilerOptions, CreateProgramOptions } from 'typescript'

const debug = debugModule('cypress:webpack')

let patched = false

const getProgramOptions = (rootNamesOrOptions: CreateProgramOptions, options: CompilerOptions): CompilerOptions => {
  return _.isArray(rootNamesOrOptions) ? options : rootNamesOrOptions.options
}

export const overrideSourceMaps = (sourceMap: boolean, typescriptPath?: string) => {
  // when using webpack-preprocessor as a local filesystem dependency (`file:...`),
  // require(typescript) will resolve to this repo's `typescript` devDependency, not the
  // targeted project's `typescript`, which breaks monkeypatching. resolving from the
  // CWD avoids this issue.
  try {
    const projectTsPath = require.resolve(typescriptPath || 'typescript', {
      paths: [process.cwd()],
    })

    const typescript = require(projectTsPath) as typeof import('typescript')
    const { createProgram } = typescript
    // NOTE: typescript.createProgram can only be monkey-patched in TypeScript versions 4 and under.
    // This is due to TypeScript v5 being an ESM package build with ESBuild, meaning the exports are
    // unmodifiable.

    // For TypeScript 5, we are currently setting sourceMaps in @cypress/webpack-batteries-included-preprocessor.
    // If you are using @cypress/webpack-preprocessor as a standalone package, you will need to set sourceMaps=true
    // inside your cypress/tsconfig.json file in order to get full codeFrame support.
    if (semverLt(typescript.version, '5.0.0')) {
      try {
        if (patched) {
          debug('typescript.createProgram() already overridden')

          return
        }

        debug('typescript %s found, overriding typescript.createProgram()', typescript.version)

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

          return createProgram.apply(typescript, args)
        }

        patched = true
      } catch (err) {
        debug('error overriding `typescript.createProgram()', err)

        // for testing purposes
        return err
      }
    } else {
      debug(`typescript version ${typescript.version} is not supported for monkey-patching`)
    }
  } catch (err) {
    debug(`error sourcing typescript from ${typescriptPath || 'typescript'}`, err)

    return err
  }
}
