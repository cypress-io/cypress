const fs = require('fs')
const path = require('path')

const useCpuUsage = process.env.CPU_USAGE_IND != null

function threeDecimals (n) {
  return Math.round(n * 1000) / 1000
}

function avgArray (els) {
  const sum = els.reduce((acc, el) => acc + el, 0)

  return threeDecimals(sum / els.length)
}

const FILE_NAME = path.join(__dirname, '..', 'results', `cpu-usage${process.env.MINIFY_IND != null ? '-minify' : ''}${process.env.USE_SNAPSHOT != null ? '-snapshot' : ''}${process.env.USE_VANILLA_SNAPSHOT != null ? '-vanilla-snapshot' : ''}.json`)

class CpuUsage {
  constructor () {
    try {
      this.data = require(FILE_NAME)
    } catch (error) {
      this.data = {}
    }
  }

  start () {
    if (useCpuUsage) {
      this.startCpuUsage = process.cpuUsage()
    }
  }

  dataFor (key) {
    if (this.data[key] == null) this.data[key] = []

    return this.data[key]
  }

  stop () {
    if (useCpuUsage) {
      const usage = process.cpuUsage(this.startCpuUsage)

      for (const key of ['user', 'system']) {
        const delta = usage[key] / 1000.0

        const data = this.dataFor(key)

        data.push(threeDecimals(delta))

        const avg = avgArray(data)

        this.data[`${key}_avg`] = avg
      }

      fs.writeFileSync(FILE_NAME, JSON.stringify(this.data, null, 2))
    }
  }
}

let cpuUsage

function initCpuUsage () {
  cpuUsage = new CpuUsage()

  return cpuUsage
}

module.exports = {
  initCpuUsage,
  get cpuUsage () {
    return cpuUsage
  },
}
