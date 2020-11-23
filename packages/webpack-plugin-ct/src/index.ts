import * as path from 'path'

const makeImport = (file, fileKey, chunkName, projectRoot) => {
  // If we want to rename the chunks, we can use this
  const magicComments = chunkName ? `/* webpackChunkName: "${chunkName}" */` : ''

  return `"${fileKey}": {
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
  init(Object.keys(allTheSpecs).map(a => allTheSpecs[a].load()))
  `
}
