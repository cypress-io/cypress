/* eslint-disable no-console */

const path = require('path')
const fs = require('fs-extra')

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

function avgArray (els) {
  const sum = els.reduce((acc, el) => acc + el, 0)

  return threeDecimals(sum / els.length)
}

class ResultsManager {
  constructor ({ run, assetType, profile, compileCache, useSnapshot, slowExecution, healthy, deferred, snapshotDev }) {
    this.label = assetType
    if (profile) this.label += '_profiling'

    if (compileCache) this.label += '_cached'

    if (slowExecution) this.label += '_slow-execution'

    if (healthy) this.label += '_healthy'

    if (deferred) this.label += '_deferred'

    if (useSnapshot) {
      if (snapshotDev) {
        this.label += '_snapshot-dev'
      } else {
        this.label += '_snapshot-prod'
      }
    }

    const filename = `perf-1-${run}.json`

    this.filePath = path.join(__dirname, '..', 'results', filename)

    try {
      this.data = require(this.filePath)
    } catch (_) {
      this.data = {}
    }
  }

  append (ms) {
    if (this.data[this.label] == null) this.data[this.label] = []

    this.data[this.label].push(threeDecimals(ms))
    const avg = avgArray(this.data[this.label])

    this.data[`${this.label}_avg`] = avg
  }

  clear () {
    this.data[this.label] = []
  }

  save () {
    fs.outputFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }

  dump () {
    const json = require(this.filePath)

    console.log(json)
  }
}

module.exports = { ResultsManager }
