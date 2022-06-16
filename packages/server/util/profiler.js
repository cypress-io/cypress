const Inspector = require('inspector-api')
const inspector = new Inspector()
const fs = require('fs')

const useSnapshot = process.env.USE_SNAPSHOT != null
const useProfiler = process.env.PROFILE_IND != null
const snapshotDev = process.env.SNAPSHOT_DEV != null

class Profiler {
  constructor (workflow) {
    this._workflow = workflow
  }

  async start () {
    if (useProfiler) {
      await inspector.profiler.enable()
      await inspector.profiler.start()
    }
  }

  async stop () {
    if (useProfiler) {
      const inspectorProf = await inspector.profiler.stop()
      let suffix = ''

      if (useSnapshot) {
        suffix += '-snapshot'
        if (snapshotDev) {
          suffix += '-dev'
        } else {
          suffix += '-prod'
        }
      }

      fs.writeFileSync(`packages/server/results/${this._workflow}${suffix}.cpuprofile`, JSON.stringify(inspectorProf))
    }
  }
}

let profiler

function initProfiler (workflow) {
  profiler = new Profiler(workflow)

  return profiler
}

module.exports = {
  initProfiler,
  get profiler () {
    return profiler
  },
}
