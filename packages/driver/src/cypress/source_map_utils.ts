/**
 * Source maps for specs evaluated in the browser.
 *
 * Previously we only read inline `data:` sourceMappingURL comments. In the real world, many builds use
 * external `.map` files instead (e.g. webpack `devtool: 'source-map'`, Rollup `sourcemap: true` with
 * separate files, or CI pipelines that strip inline maps for size). Those stacks were invisible to
 * Cypress: no consumer was registered, so Studio/Prompt-style features that need original file/line
 * saw generated locations only.
 *
 * We now: (1) find the effective pragma like other tools (last mapping URL in the file), (2) fetch
 * external maps via the same XHR path as script loading, (3) fix resolution for Cypress’s
 * `/…/tests?p=<path>` URLs (normal URL() resolution would point at the wrong resource), and
 * (4) record per-script load outcomes for debugging and future telemetry.
 */
import { SourceMapConsumer } from 'source-map'

import type { BasicSourceMapConsumer } from 'source-map'
// @ts-ignore
import mappingsWasm from 'source-map/lib/mappings.wasm'

import $utils from './utils'
import { toPosix } from './util/to_posix'
import path from 'path'
import $networkUtils from './network_utils'

const regexDataUrl = /data:[^;\n]+(?:;charset=[^;\n]+)?;base64,(.*)/ // matches data urls

/**
 * Cypress does not serve the spec at a normal path; it uses a query param. Relative map URLs in the
 * emitted JS (e.g. `//# sourceMappingURL=spec.cy.js.map`) must be resolved against that logical path,
 * not against pathname `/…/tests` only — otherwise we would request the wrong URL and miss the map.
 */
const CYPRESS_TESTS_QUERY_RE = /^(\/.+?\/tests)\?p=(.+)$/

const ampersandRe = /&/g
const percentRe = /%/g
const questionRe = /\?/g
const plusRe = /\+/g

/**
 * Same escaping as `@packages/server` `escapeFilenameInUrl`. Real project paths can contain `?`, `&`,
 * `%`, `+`; the server encodes them in `p=`. Rebuilt map URLs must use the same encoding or the
 * devserver returns 404 and external maps never load.
 */
const escapeFilenameInUrl = (url: string) => {
  return url
  .replace(percentRe, '%25')
  .replace(ampersandRe, '%26')
  .replace(questionRe, '%3F')
  .replace(plusRe, '%2B')
}

let sourceMapConsumers: Record<string, BasicSourceMapConsumer> = {}
let sourceMapProjectRoot: string = ''

export type SourceMapLoadDiagnostic = {
  status: 'missing' | 'inline' | 'external' | 'inline_parse_error' | 'external_fetch_error' | 'external_parse_error' | 'consumer_init_error'
  detail?: string
}

// One entry per spec script URL (posix). Used to tell “no pragma” vs “fetch failed” vs “bad JSON” —
// all of those looked identical before (no consumer) when debugging Studio/Prompt location misses.
let sourceMapLoadDiagnostics: Record<string, SourceMapLoadDiagnostic> = {}

const recordSourceMapLoadDiagnostic = (scriptUrl: string | undefined, diagnostic: SourceMapLoadDiagnostic) => {
  if (!scriptUrl) return

  sourceMapLoadDiagnostics[toPosix(scriptUrl)] = diagnostic
}

const clearSourceMapLoadDiagnostics = () => {
  sourceMapLoadDiagnostics = {}
}

const getSourceMapLoadDiagnostic = (scriptUrl: string): SourceMapLoadDiagnostic | undefined => {
  return sourceMapLoadDiagnostics[toPosix(scriptUrl)]
}

const initializeSourceMapConsumer = async (script, sourceMap): Promise<BasicSourceMapConsumer | null> => {
  if (!sourceMap) return null

  // @ts-ignore
  SourceMapConsumer.initialize({
    'lib/mappings.wasm': mappingsWasm,
  })

  const consumer = await new SourceMapConsumer(sourceMap)

  sourceMapConsumers[toPosix(script.fullyQualifiedUrl)] = consumer

  return consumer
}

/**
 * Returns the last `sourceMappingURL` in the file. Spec and tooling convention: the final pragma wins
 * when multiple exist (concatenated bundles, temp file + final file). We also support `//@` and
 * block-comment pragmas (`# sourceMappingURL=` inside slash-star comments) that some minifiers emit —
 * those were previously ignored if we only matched `//#` plus `data:`. Uses `exec` in a loop instead
 * of `match(/g)` so huge vendor blobs with hundreds of comments do not allocate massive arrays
 * (see cypress#7464-style failures).
 */
const getLastSourceMappingUrl = (fileContents: string): string | null => {
  let bestIdx = -1
  let bestUrl: string | null = null

  const lineRe = /\/\/[@#]\s*sourceMappingURL\s*=\s*(\S+)/g
  let m: RegExpExecArray | null

  while ((m = lineRe.exec(fileContents)) !== null) {
    if (m.index >= bestIdx) {
      bestIdx = m.index
      bestUrl = m[1]
    }
  }

  const blockRe = /\/\*[@#]\s*sourceMappingURL\s*=\s*([\s\S]+?)\s*\*\//g

  while ((m = blockRe.exec(fileContents)) !== null) {
    if (m.index >= bestIdx) {
      bestIdx = m.index
      bestUrl = m[1].trim()
    }
  }

  if (!bestUrl) return null

  // Some tools wrap the URL in quotes; the browser would strip these when loading, we normalize the same.
  return bestUrl.replace(/^['"]|['"]$/g, '')
}

/**
 * Turns the raw `sourceMappingURL` string into what `network_utils.fetch` must request.
 *
 * - Absolute `https?://` maps (e.g. CDN-hosted) are used as-is — supported by source-map consumers in
 *   enterprise setups; same-origin XHR may still fail without CORS, but we do not silently rewrite.
 * - Root-relative `/assets/…` maps resolve against the spec origin (typical of server-rendered apps).
 * - Cypress `tests?p=` URLs need a custom join so `foo.js` + `foo.js.map` becomes the correct `p=`
 *   value; `new URL('foo.js.map', 'http://host/ns/tests?p=…')` incorrectly yields `http://host/foo.js.map`.
 * - Plain relative URLs fall through to `URL()` for paths like `cypress/integration/x.js` in tests.
 */
const resolveSourceMapFetchUrl = (
  fullyQualifiedUrl: string,
  scriptRelativeUrl: string,
  sourceMappingRef: string,
): string => {
  const trimmed = sourceMappingRef.trim()

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed
  }

  const fq = new URL(fullyQualifiedUrl)

  if (trimmed.startsWith('/')) {
    return `${fq.origin}${trimmed}`
  }

  const relMatch = scriptRelativeUrl.match(CYPRESS_TESTS_QUERY_RE)

  if (relMatch) {
    const testsPath = relMatch[1]
    const pRaw = relMatch[2]
    const decodedPath = decodeURIComponent(pRaw).replace(/\\/g, '/')
    const dir = path.posix.dirname(decodedPath)
    const joined = path.posix.normalize(path.posix.join(dir, trimmed))
    const escaped = escapeFilenameInUrl(joined)

    return `${testsPath}?p=${escaped}`
  }

  return new URL(trimmed, fullyQualifiedUrl).href
}

const parseDataSourceMappingUrl = (dataUrl: string) => {
  const dataUrlMatch = dataUrl.match(regexDataUrl)

  if (!dataUrlMatch) return null

  const sourceMapBase64 = dataUrlMatch[1]
  const sourceMap = base64toJs(sourceMapBase64)

  return sourceMap
}

/**
 * Synchronous parse for inline maps only. Kept for callers/tests that expect a JSON object without I/O.
 * When the effective pragma is external (`foo.js.map`), returns null — the map is loaded in
 * `loadAndInitializeSourceMap` instead; previously the whole pragma was ignored so neither path worked.
 */
const extractSourceMap = (fileContents) => {
  const ref = getLastSourceMappingUrl(fileContents)

  if (!ref || !ref.startsWith('data:')) return null

  return parseDataSourceMappingUrl(ref)
}

/**
 * Registers a SourceMapConsumer for this script: inline `data:` is parsed here; external refs are
 * fetched first. Without this, real-world bundles that emit `//# sourceMappingURL=file.map` never got
 * a consumer, so stack mapping / invocationDetails stayed on generated code (bad for Studio test blocks
 * and cy.prompt file edits that anchor on source line/column).
 */
const loadAndInitializeSourceMap = async (
  specWindow: Window,
  script: { fullyQualifiedUrl?: string, relativeUrl: string },
  fileContents: string,
) => {
  const scriptUrl = script.fullyQualifiedUrl
  const ref = getLastSourceMappingUrl(fileContents)

  if (!ref) {
    recordSourceMapLoadDiagnostic(scriptUrl, { status: 'missing' })

    return
  }

  if (ref.startsWith('data:')) {
    const parsed = parseDataSourceMappingUrl(ref)

    if (!parsed) {
      recordSourceMapLoadDiagnostic(scriptUrl, { status: 'inline_parse_error' })

      return
    }

    recordSourceMapLoadDiagnostic(scriptUrl, { status: 'inline' })

    try {
      await initializeSourceMapConsumer(script, parsed)
    } catch (_err) {
      recordSourceMapLoadDiagnostic(scriptUrl, { status: 'consumer_init_error', detail: 'wasm_or_consumer' })
    }

    return
  }

  // External maps need a base URL for resolution; if `window.top` threw (cy-in-cy), we cannot fetch.
  if (!scriptUrl) {
    recordSourceMapLoadDiagnostic(scriptUrl, {
      status: 'external_fetch_error',
      detail: 'missing_fully_qualified_script_url',
    })

    return
  }

  const mapFetchUrl = resolveSourceMapFetchUrl(scriptUrl, script.relativeUrl, ref)

  try {
    // Same XHR helper as spec script load so behavior matches (cookies, relative URL base, iframe window).
    const mapText = await $networkUtils.fetch(mapFetchUrl, specWindow as Window & typeof globalThis) as string
    let parsed: unknown

    try {
      parsed = JSON.parse(mapText)
    } catch (parseErr: any) {
      recordSourceMapLoadDiagnostic(scriptUrl, {
        status: 'external_parse_error',
        detail: parseErr?.message || 'invalid_json',
      })

      return
    }

    recordSourceMapLoadDiagnostic(scriptUrl, { status: 'external' })

    try {
      await initializeSourceMapConsumer(script, parsed as any)
    } catch (_err) {
      // Map JSON was valid but wasm/source-map library failed (e.g. some WebKit builds) — same graceful
      // degradation as before; diagnostic distinguishes “never fetched” from “fetched but unusable”.
      recordSourceMapLoadDiagnostic(scriptUrl, { status: 'consumer_init_error', detail: 'wasm_or_consumer' })
    }
  } catch (fetchErr: any) {
    recordSourceMapLoadDiagnostic(scriptUrl, {
      status: 'external_fetch_error',
      detail: fetchErr?.message || 'fetch_failed',
    })
  }
}

const getSourceContents = (filePath, sourceFile) => {
  const posixFilePath = toPosix(filePath)

  if (!sourceMapConsumers[posixFilePath]) return null

  try {
    return sourceMapConsumers[posixFilePath].sourceContentFor(sourceFile)
  } catch (err) {
    // ignore the sourceFile not being in the source map. there's nothing we
    // can do about it and we don't want to thrown an exception
    if (err && err.message.indexOf('not in the SourceMap') > -1) return

    throw err
  }
}

const getSourcePosition = (filePath, position) => {
  const posixFilePath = toPosix(filePath)
  const sourceMapConsumer = sourceMapConsumers[posixFilePath]

  if (!sourceMapConsumer) return null

  const { source, line, column } = sourceMapConsumer.originalPositionFor(position)

  if (!source || line == null || column == null) return

  // if the file is outside of the projectRoot
  // originalPositionFor will not provide the correct relative path
  // https://github.com/cypress-io/cypress/issues/16255
  // @ts-expect-error
  const sourceIndex = sourceMapConsumer._absoluteSources.indexOf(source)
  // @ts-expect-error
  const file = sourceMapConsumer._sources.at(sourceIndex)

  return {
    file,
    line,
    column,
  }
}

const base64toJs = (base64) => {
  try {
    const mapString = $utils.decodeBase64Unicode(base64)

    return JSON.parse(mapString)
  } catch (err) {
    return null
  }
}

const destroySourceMapConsumers = () => {
  Object.values(sourceMapConsumers).forEach((consumer) => {
    consumer.destroy()
  })

  sourceMapConsumers = {}
  sourceMapProjectRoot = ''
  // Avoid leaking stale diagnostics across spec reloads / runs (would misreport the next file’s state).
  clearSourceMapLoadDiagnostics()
}

const areSourceMapsAvailable = () => {
  return Object.keys(sourceMapConsumers).length > 0
}

/**
 * Establishes the project root from the source map's perspective.
 *
 * @param relativePath - The relative path of an anchor file where we know the absolute path.
 * @param absolutePath - The absolute path of the anchor file.
 * @param projectRoot - The project root. Used as a back up if we cannot determine the project root from the source map.
 * @returns The project root from the source map's perspective
 */
const setSourceMapProjectRoot = (relativePath: string, absolutePath: string, projectRoot: string) => {
  const keys = Object.keys(sourceMapConsumers)

  if (keys.length === 0) {
    sourceMapProjectRoot = projectRoot

    return
  }

  const posixRelativePath = toPosix(relativePath)
  const key = keys.find((key) => key.endsWith(posixRelativePath))

  if (!key) {
    sourceMapProjectRoot = projectRoot

    return
  }

  const consumer = sourceMapConsumers[key]

  for (const [index, source] of consumer.sources.entries()) {
    const strippedSource = $utils.stripCustomProtocol(source)

    if (strippedSource !== undefined && absolutePath?.endsWith(strippedSource)) {
      // @ts-expect-error
      const relativeSource = consumer._sources.at(index)
      const strippedRelativeSource = $utils.stripCustomProtocol(relativeSource)

      if (strippedRelativeSource !== undefined) {
        // get the directory where relativeSource applied to the directory gives you the absolute path
        const baseDirectory = getBaseDirectory(absolutePath, strippedRelativeSource)

        sourceMapProjectRoot = baseDirectory ?? projectRoot

        return
      }
    }
  }

  sourceMapProjectRoot = projectRoot

  return
}

const getSourceMapProjectRoot = () => {
  return sourceMapProjectRoot
}

/**
 * Gets the base directory that satisfies the relationship between the absolute and relative paths.
 *
 * For example:
 *
 * absolutePath: /project/src/components/Button.tsx
 * relativePath: src/components/Button.tsx
 *
 * The base directory is /project
 *
 * @param absolutePath - The absolute path.
 * @param relativePath - The relative path.
 * @returns The base directory that satisfies the relationship between the absolute and relative paths.
 */
const getBaseDirectory = (absolutePath: string, relativePath: string) => {
  const absNormalized = path.normalize(absolutePath)
  const relNormalized = path.normalize(relativePath)

  let dir = path.dirname(absNormalized)
  let parent = path.dirname(dir)

  while (parent !== dir) {
    if (path.join(dir, relNormalized) === absNormalized) {
      return dir
    }

    dir = parent
    parent = path.dirname(dir)
  }

  // Check the root directory
  if (path.join(dir, relNormalized) === absNormalized) {
    return dir
  }

  return null
}

export default {
  getSourcePosition,
  getSourceContents,
  extractSourceMap,
  // Exposed for tests and future UI/telemetry; map how real bundles name their last pragma and where we fetch.
  getLastSourceMappingUrl,
  resolveSourceMapFetchUrl,
  loadAndInitializeSourceMap,
  getSourceMapLoadDiagnostic,
  initializeSourceMapConsumer,
  destroySourceMapConsumers,
  areSourceMapsAvailable,
  setSourceMapProjectRoot,
  getSourceMapProjectRoot,
  getBaseDirectory,
}
