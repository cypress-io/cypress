/* global Cypress */
/// <reference types="cypress" />

import debugFn from 'debug'
import * as path from 'path'
import type { LoaderContext } from 'webpack'
import type { CypressCTWebpackContext } from './CypressCTWebpackPlugin'
const debug = debugFn('cypress:webpack-dev-server:webpack')

/**
 * @param {ComponentSpec} file spec to create import string from.
 * @param {string} filename name of the spec file - this is the same as file.name
 * @param {string} chunkName webpack chunk name. eg: 'spec-0'
 * @param {string} projectRoot absolute path to the project root. eg: /Users/<username>/my-app
 */
const makeImport = (file: Cypress.Cypress['spec'], filename: string, chunkName: string, projectRoot: string) => {
  // If we want to rename the chunks, we can use this
  const magicComments = chunkName ? `/* webpackChunkName: "${chunkName}" */` : ''

  return `"${filename}": {
    shouldLoad: () => new URLSearchParams(document.location.search).get("specPath") === "${file.absolute}",
    load: () => import("${file.absolute}" ${magicComments}),
    absolute: "${file.absolute.split(path.sep).join(path.posix.sep)}",
    relative: "${file.relative.split(path.sep).join(path.posix.sep)}",
    relativeUrl: "/__cypress/src/${chunkName}.js",
  }`
}

/**
 * Creates a object mapping a spec file to an object mapping
 * the spec name to the result of `makeImport`.
 *
 * @returns {Record<string, ReturnType<makeImport>}
 * {
 *   "App.spec.js": {
 *     shouldLoad: () => (new URL(document.location)).searchParams.get("specPath") === "cypress/component/App.spec.js",
 *     load: () => {
 *       return import("/Users/projects/my-app/cypress/component/App.spec.js" \/* webpackChunkName: "spec-0" *\/)
 *     },
 *     chunkName: "spec-0"
 *   }
 * }
 */
function buildSpecs (projectRoot: string, files: Cypress.Cypress['spec'][] = []): string {
  if (!Array.isArray(files)) return `{}`

  debug(`projectRoot: ${projectRoot}, files: ${files.map((f) => f.absolute).join(',')}`)

  return `{${files.map((f, i) => {
    return makeImport(f, f.name, `spec-${i}`, projectRoot)
  }).join(',')}}`
}

// Runs the tests inside the iframe
export default function loader (this: unknown) {
  const ctx = this as CypressCTWebpackContext & LoaderContext<void>

  // In Webpack 5, a spec added after the dev-server is created won't
  // be included in the compilation. Disabling the caching of this loader ensures
  // we regenerate our specs and include any new ones in the compilation.
  ctx.cacheable(false)
  const { files, projectRoot, supportFile } = ctx._cypress

  const supportFileAbsolutePath = supportFile ? JSON.stringify(path.resolve(projectRoot, supportFile)) : undefined
  const supportFileRelativePath = supportFile ? JSON.stringify(path.relative(projectRoot, supportFileAbsolutePath || '')) : undefined
  const result = `
  var allTheSpecs = ${buildSpecs(projectRoot, files)};

  var { init } = require(${JSON.stringify(require.resolve('./aut-runner'))})

  var scriptLoaders = Object.values(allTheSpecs).reduce(
    (accSpecLoaders, specLoader) => {
      if (specLoader.shouldLoad()) {
        accSpecLoaders.push(specLoader)
      }
      return accSpecLoaders
  }, [])

  if (${!!supportFile}) {
    var supportFile = {
      absolute: ${supportFileAbsolutePath},
      relative: ${supportFileRelativePath},
      relativeUrl: "/__cypress/src/cypress-support-file.js",
      load: () => import(${supportFileAbsolutePath} /* webpackChunkName: "cypress-support-file" */),
    }
    scriptLoaders.unshift(supportFile)
  }

  init(scriptLoaders)
  `

  return result
}
