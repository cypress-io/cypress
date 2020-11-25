import * as path from 'path'
import hashSum from 'hash-sum'

const makeImport = (file, fileKey, chunkName, projectRoot) => {
  // If we want to rename the chunks, we can use this
  const magicComments = chunkName ? `/* webpackChunkName: "${chunkName}" */` : ''

  return `"${fileKey}": {
    shouldLoad: () => document.location.pathname.includes(${JSON.stringify(hashSum(file.relative))}),
    load: () => {
      return import(${JSON.stringify(path.resolve(projectRoot, file.relative), null, 2)} ${magicComments})
    },
    chunkName: "${chunkName}",
  }`
}

function buildSpecs (files, projectRoot) {
  return `{${files.map((f, i) => {
    return makeImport(f, f.name, `spec-${i}`, projectRoot)
  }).join(',')}}`
}

// Runs the tests inside the iframe
export default function loader () {
  const { files, projectRoot } = this._cypress

  return `
  var allTheSpecs = ${buildSpecs(files, projectRoot)};

  const { init } = require(${JSON.stringify(require.resolve('./aut-runner'))})

  init(Object.keys(allTheSpecs)
    .filter(key => allTheSpecs[key].shouldLoad())
    .map(a => allTheSpecs[a].load())
  )
  `
}
