/* eslint-disable no-console */
const { promises } = require('fs')

const fs = promises

async function loadInternalTaskData () {
  const filename = process.env.CIRCLE_INTERNAL_CONFIG

  if (!filename) throw new Error('Missing CIRCLE_INTERNAL_CONFIG environment variable, cannot load Circle task data.')

  const taskDataJson = await fs.readFile(filename, 'utf8')

  try {
    return JSON.parse(taskDataJson)
  } catch (err) {
    throw new Error(`An error occurred while parsing the Circle task data: ${err}`)
  }
}

// check if the project env canary and context canary are both present to verify that this script is reading the right env
async function checkCanaries () {
  if (!process.env.CI) console.warn('This script will not work outside of CI.')

  const circleEnv = await readCircleEnv()

  if (!circleEnv.MAIN_CANARY) throw new Error('Missing MAIN_CANARY.')

  if (!circleEnv.CONTEXT_CANARY) throw new Error('Missing CONTEXT_CANARY. Does this job have the test-runner:env-canary context?')
}

// Returns a map of environment variables defined for this job. `readCircleEnv()` differs from `process.env` - it will
// only return environment variables explicitly specified for this job by CircleCI project env and contexts
// NOTE: this Circle API is not stable, and yet it is the only way to access this information.
async function readCircleEnv () {
  const taskData = await loadInternalTaskData()

  try {
    const circleEnv = taskData['Dispatched']['TaskInfo']['Environment']

    if (!circleEnv || !Object.keys(circleEnv).length) throw new Error('An empty Environment object was found.')

    return circleEnv
  } catch (err) {
    throw new Error(`An error occurred when reading the environment from Circle task data: ${err}`)
  }
}

module.exports = {
  readCircleEnv,
}

if (require.main === module) {
  if (process.argv.includes('--check-canaries')) {
    checkCanaries()
  } else {
    console.error(`No options were passed, but ${__filename} was invoked as a script.`)
    process.exit(1)
  }
}
