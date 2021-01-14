/* global Cypress */
/// <reference types="cypress" />

import * as path from 'path'
import { CypressCTWebpackContext } from './plugin'

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
    shouldLoad: () => document.location.pathname.includes(${JSON.stringify(file.relative)}),
    load: () => import(${JSON.stringify(path.resolve(projectRoot, file.relative))} ${magicComments}),
    chunkName: "${chunkName}",
  }`
}

/**
 * Creates a object maping a spec file to an object mapping
 * the spec name to the result of `makeImport`.
 *
 * @returns {Record<string, ReturnType<makeImport>}
 * {
 *   "App.spec.js": {
 *     shouldLoad: () => document.location.pathname.includes("cypress/component/App.spec.js"),
 *     load: () => {
 *       return import("/Users/projects/my-app/cypress/component/App.spec.js" \/* webpackChunkName: "spec-0" *\/)
 *     },
 *     chunkName: "spec-0"
 *   }
 * }
 */
function buildSpecs (projectRoot: string, files: Cypress.Cypress['spec'][] = []): string {
  if (!Array.isArray(files)) return `{}`

  return `{${files.map((f, i) => {
    return makeImport(f, f.name, `spec-${i}`, projectRoot)
  }).join(',')}}`
}

// Runs the tests inside the iframe
export default function loader (this: CypressCTWebpackContext) {
  const { files, projectRoot, supportFile } = this._cypress

  const supportFileAbsolutePath = supportFile ? JSON.stringify(path.resolve(projectRoot, supportFile)) : undefined

  return `
  var loadSupportFile = ${supportFile ? `() => import(${supportFileAbsolutePath})` : `() => Promise.resolve()`}
  var allTheSpecs = ${buildSpecs(projectRoot, files)};

  var { init } = require(${JSON.stringify(require.resolve('./aut-runner'))})

  var scriptLoaders = Object.values(allTheSpecs).reduce(
    (accSpecLoaders, specLoader) => {
      if (specLoader.shouldLoad()) {
        accSpecLoaders.push(specLoader.load)
      }
      return accSpecLoaders
  }, [loadSupportFile])

  init(scriptLoaders)
  `
}
