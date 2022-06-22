'use strict'

const { strict: assert } = require('assert')
const fs = require('fs')
const path = require('path')
const getTime = require('performance-now')

const useProfiler = process.env.PROFILE_IND != null

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

function avgArray (els) {
  const sum = els.reduce((acc, el) => acc + el, 0)

  return threeDecimals(sum / els.length)
}

class Benchmark {
  constructor (workflow) {
    this._workflow = workflow

    if (!useProfiler) {
      const filename = `${this._workflow}${process.env.MINIFY_IND != null ? '-minify' : ''}.json`

      this.filePath = path.join(__dirname, '..', 'results', filename)

      try {
        this.data = require(this.filePath)
      } catch (_) {
        this.data = {}
      }

      this._measures = new Map()
    }
  }

  dataFor (key) {
    if (this.data[key] == null) this.data[key] = []

    return this.data[key]
  }

  time (key) {
    if (!useProfiler) {
      const now = getTime()

      this._measures.set(key, now)
    }
  }

  timeEnd (key) {
    if (!useProfiler) {
      assert(this._measures.has(key), `${key} not added via time()`)
      const now = getTime()
      const before = this._measures.get(key)
      const delta = now - before

      const data = this.dataFor(key)

      data.push(threeDecimals(delta))

      const avg = avgArray(data)

      this.data[`${key}_avg`] = avg
    }
  }

  save () {
    if (!useProfiler) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
    }
  }

  dumpData () {
    if (!useProfiler) {
    // eslint-disable-next-line
    console.log(this.data)
    }
  }

  dumpAverages () {
    if (!useProfiler) {
      const rx = /_avg$/
      const d = {}

      for (const [key, val] of Object.entries(this.data)) {
        if (rx.test(key)) d[key] = val
      }
      // eslint-disable-next-line
    console.log(d)
    }
  }
}

let benchmark

function initBenchmark (workflow) {
  assert(benchmark == null, 'Benchmark can only be initialized once')
  benchmark = new Benchmark(workflow)

  return benchmark
}

module.exports = {
  initBenchmark,
  get benchmark () {
    assert(benchmark != null, 'benchmark needs to be initialized')

    return benchmark
  },
}
