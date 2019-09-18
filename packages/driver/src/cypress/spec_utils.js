const _ = require('lodash')
const Promise = require('bluebird')

const $networkUtils = require('./network_utils')
const $sourceMapUtils = require('./source_map_utils')

const fetchSpec = (specWindow, spec) => {
  return $networkUtils.fetch(spec.relativeUrl, specWindow)
  .then((specContents) => {
    return [spec, specContents]
  })
}

const extractSourceMap = ([spec, contents]) => {
  spec.fullyQualifiedUrl = `${window.top.location.origin}${spec.relativeUrl}`

  return $sourceMapUtils.extractSourceMap(spec, contents)
  .return([spec, contents])
}

const evalSpecs = (specWindow, specs = []) => {
  _.each(specs, ([spec, contents]) => {
    specWindow.eval(`${contents}\n//# sourceURL=${spec.fullyQualifiedUrl}`)
  })

  return null
}

const runSpecs = (specWindow, specs) => {
  return Promise
  .map(specs, (spec) => fetchSpec(specWindow, spec))
  .map(extractSourceMap)
  .then((specs) => evalSpecs(specWindow, specs))
}

module.exports = {
  runSpecs,
}
