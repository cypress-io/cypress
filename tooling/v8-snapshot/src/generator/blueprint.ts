import fs from 'fs'
import path from 'path'
import { BUNDLE_WRAPPER_OPEN } from './create-snapshot-script'
import { processSourceMap } from '../sourcemap/process-sourcemap'
import debug from 'debug'
import { forwardSlash } from '../utils'

const logDebug = debug('cypress:snapgen:debug')

function read (part: string, indent = '  ') {
  const p = require.resolve(`../blueprint/${part}`)
  const s = fs.readFileSync(p, 'utf8')

  return s.split('\n').join(`\n${indent}`)
}

const globals = read('globals')
const strictGlobals = read('globals-strict')
const customRequire = read('custom-require')
const setGlobals = read('set-globals')

/**
 * Configures the generation of the snapshot script from the _Blueprint_
 * templates.
 *
 * @property processPlatform value to return during snapshot creation for `process.platform`
 * @property processNodeVersion value to return during snapshot creation for `process.version`
 * @property mainModuleRequirePath relative path to the module we consider the
 * main entry point.
 * NOTE: the {@link SnapshotDoctor} changes this in order to verify multiple
 * modules using the same bundle.
 * @property auxiliaryData data to embed with the snapshot
 * @property customRequireDefinitions a hash of module initializer functions
 * that are bundled
 * @property includeStrictVerifiers see {@link GenerationOpts} includeStrictVerifiers
 * @property nodeEnv see {@link GenerationOpts} nodeEnv
 * @property cypressInternalEnv see {@link GenerationOpts} cypressInternalEnv
 * @property basedir the base dir of the project for which we are creating the
 * snapshot
 * @property sourceMap {@link Buffer} with content of raw sourcemaps
 * @property supportTypeScript see {@link GenerationOpts} supportTypeScript
 */
export type BlueprintConfig = {
  processPlatform: string
  processNodeVersion: string
  mainModuleRequirePath: string
  auxiliaryData: string
  customRequireDefinitions: Buffer
  includeStrictVerifiers: boolean
  nodeEnv: string
  cypressInternalEnv: string
  basedir: string
  sourceMap: Buffer | undefined
  processedSourceMapPath: string | undefined
  supportTypeScript: boolean
  integrityCheckSource: string | undefined
}

const pathSep = path.sep === '\\' ? '\\\\' : path.sep

/**
 * Generates the snapshot script from the templates found inside `./blueprint`
 * and the provided {@link BlueprintConfig} and returns it a long with the
 * processed sourcemaps.
 *
 * When rendering the snapshot script we take care of the following
 * (in order of occurrence in the rendered script):
 *
 * 1. We embed the path separator so that we have it available inside the
 *    snapshot without having to refer to the `path` module
 *
 * 2. We also include helper methods like `cannotAccess` which are invoked
 *    whenever a feature of JavaScript is accessed that would cause issues
 *    when snapshotting.
 *    We use this to throw an error during snapshot script verification in
 *    order to signal to the doctor that something went wrong.
 *    Additionally it allows us to debug any issues in a better way than
 *    looking at a `mksnapshot` tool Segfault.
 *
 * 3. Additionally we stub out a minimal version of `process` to be used
 *    while snapshotting
 *
 * 4. In order to catch all problems during snapshot verification we include
 *    stricter verifiers from `./blueprint/globals-strict.js` while we are
 *    running the doctor.
 *    We also set `require.isStrict = true` to query it inside
 *    ./blueprint/custom-require.js in order to optimize error messages for
 *    the specific context.
 *    When we create the final snapshot script which will be snapshotted we
 *    include less stricter versions of globals from ./blueprint/globals.js.
 */
export function scriptFromBlueprint (config: BlueprintConfig): {
  script: Buffer
  processedSourceMap: string | undefined
} {
  const {
    processPlatform,
    processNodeVersion,
    mainModuleRequirePath,
    auxiliaryData,
    customRequireDefinitions,
    includeStrictVerifiers,
    nodeEnv,
    cypressInternalEnv,
    basedir,
    sourceMap,
    supportTypeScript,
    integrityCheckSource,
  } = config

  const normalizedMainModuleRequirePath = forwardSlash(mainModuleRequirePath)

  const wrapperOpen = Buffer.from(
    `
(function () {
  const PATH_SEP = '${pathSep}'
  ${integrityCheckSource || ''}

  function generateSnapshot() {
    //
    // <process>
    //
    function cannotAccess(proto, prop) {
      return function () {
        throw 'Cannot access ' + proto + '.' + prop + ' during snapshot creation'
      }
    }
    function getPrevent(proto, prop) {
      return {
        get: cannotAccess(proto, prop)
      }
    }

    let process = {}
    Object.defineProperties(process, {
      platform: {
        value: '${processPlatform}',
        enumerable: false,
      },
      argv: {
        value: [],
        enumerable: false,
      },
      env: {
        value: {
          NODE_ENV: '${nodeEnv}',
          CYPRESS_INTERNAL_ENV: '${cypressInternalEnv}',
        },
        enumerable: false,
      },
      version: {
        value: '${processNodeVersion}',
        enumerable: false,
      },
      versions: {
        value: { node: '${processNodeVersion}' },
        enumerable: false,
      },
      nextTick: getPrevent('process', 'nextTick')
    })

    function get_process() {
      return process
    }
    //
    // </process>
    //

    ${globals}
    ${includeStrictVerifiers ? strictGlobals : ''}
`,
    'utf8',
  )
  const wrapperClose = Buffer.from(
      `
    ${customRequire}
    ${includeStrictVerifiers ? 'require.isStrict = true' : ''}

    customRequire(${normalizedMainModuleRequirePath}, ${normalizedMainModuleRequirePath})
    const result = {}
    Object.defineProperties(result, {
      customRequire: {
        writable: false,
        value: customRequire
      },
      setGlobals: {
        writable: false,
        value: ${setGlobals}
      },
      snapshotAuxiliaryData: {
        writable: false,
        value: ${auxiliaryData},
      },
    })
    return result
  }

  let numberOfGetSnapshotResultCalls = 0
  const snapshotResult = generateSnapshot.call({})
  Object.defineProperties(this, {
    getSnapshotResult: {
      writable: false,
      value: function () {
        if (numberOfGetSnapshotResultCalls > 0) {
          throw new Error('getSnapshotResult can only be called once')
        }
        numberOfGetSnapshotResultCalls++
        return snapshotResult
      },
    },
    supportTypeScript: {
      writable: false,
      value: ${supportTypeScript},
    },
  })
  generateSnapshot = null
}).call(this)
`,
      'utf8',
  )

  const buffers = [wrapperOpen, customRequireDefinitions, wrapperClose]

  // Now we rendered the prelude and can calculate the bundle line offset and thus
  // process and include source maps. Since it is expensive we only do this if we
  // have a valid sourcemap.
  let offsetToBundle: number | undefined = undefined

  let processedSourceMap: string | undefined

  if (sourceMap != null) {
    offsetToBundle =
      newLinesInBuffer(wrapperOpen) + newLinesInBuffer(BUNDLE_WRAPPER_OPEN)

    processedSourceMap = processSourceMap(sourceMap, basedir, offsetToBundle)

    if (processedSourceMap != null && config.processedSourceMapPath != null) {
      logDebug(
        '[sourcemap] writing sourcemap to "%s"',
        config.processedSourceMapPath,
      )

      fs.writeFileSync(config.processedSourceMapPath, processedSourceMap)
    }
  }

  return { script: Buffer.concat(buffers), processedSourceMap }
}

const CR_CODE = '\n'.charCodeAt(0)

/**
 * Fast way to count new lines in a buffer.
 * Converting to string and splitting on new-line would be slow.
 */
function newLinesInBuffer (buf: Buffer) {
  const newLines = buf.filter((x) => x === CR_CODE)

  return newLines.length
}
