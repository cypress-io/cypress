const Inspector = require('inspector-api')
const inspector = new Inspector()
const fs = require('fs')

const useProfiler = process.env.PROFILE_IND != null

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

      fs.writeFileSync(`packages/server/results/${this._workflow}${process.env.MINIFY_IND != null ? '-minify' : ''}${process.env.USE_SNAPSHOT != null ? '-snapshot' : ''}${process.env.USE_VANILLA_SNAPSHOT != null ? '-vanilla-snapshot' : ''}.cpuprofile`, JSON.stringify(inspectorProf))
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
