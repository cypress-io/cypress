const path = require('path')

module.exports = async function bundleSpecs ({ files, projectRoot, support }, loaderContext) {
  const makeImport = (file, fileKey, chunkName) => {
    // If we want to rename the chunks, we can use this
    const magicComments = chunkName ? `/* webpackChunkName: "${chunkName}" */` : ''

    return `"${fileKey}": {
      load: () => {
        return import("./${file.relativeToThisFile}" ${magicComments})
      },
      reset: () => {
        delete require.cache[require.resolve('./${file.relativeToThisFile}')] 
      },
      path: "${file.absolute}",
      relativeToThisFile: "./${file.relativeToThisFile}",
      relativeToProject: "${file.relativeToProject}",
      chunkName: "${chunkName}",
    }`
  }

  function buildSpecs (files) {
    return `{${files.map((f) => {
      return makeImport(f, f.relativeToProject, f.chunkName)
    }).join(',')}}`
  }

  function buildSupport (file) {
    return makeImport(file, 'support', 'support')
  }

  files = [
    ...files,
    support,
  ].map((p, idx) => {
    return {
      ...p,
      relativeToProject: path.relative(projectRoot, p.path),
      relativeToThisFile: path.relative(__dirname, p.path),
      chunkName: `${idx}-spec`,
      spec: support !== p,
    }
  })

  const supportImport = buildSupport(files.filter((f) => !f.spec)[0])

  return {
    code: `
    ${require('./hmr-client.js')(files)}
    module.exports = {
      files: ${buildSpecs(files.filter((f) => f.spec))},
      ${supportImport}
    }
    `,
  }
}
