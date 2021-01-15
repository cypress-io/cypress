/* global Cypress */
/// <reference types="cypress" />

import * as path from 'path'

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
    load: () => {
      return import(${JSON.stringify(path.resolve(projectRoot, file.relative), null, 2)} ${magicComments})
    },
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
export default function loader () {
  const { files, projectRoot } = this._cypress as { files: Cypress.Cypress['spec'][], projectRoot: string }

  return `
  var allTheSpecs = ${buildSpecs(projectRoot, files)};

  const { init } = require(${JSON.stringify(require.resolve('./aut-runner'))})

  const { restartRunner } = init(Object.keys(allTheSpecs)
    .filter(key => allTheSpecs[key].shouldLoad())
    .map(a => allTheSpecs[a].load())
  )
  `
}
