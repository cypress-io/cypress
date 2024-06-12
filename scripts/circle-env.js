const fs = require('fs').promises

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

  // if the config contains only CIRCLE_PLUGIN_TEST, treat the config as if it were empty
  const containsOnlyAllowedEnvs = () => {
    const circleEnvKeys = Object.keys(circleEnv)

    return circleEnvKeys.length === 0 || (circleEnvKeys.length === 1 &&
      circleEnvKeys.includes('CIRCLE_PLUGIN_TEST'))
  }

  if (containsOnlyAllowedEnvs()) {
    return console.warn('CircleCI env empty or contains only allowed envs, assuming this is a contributor PR. Not checking for canary variables.')
  }

  if (!circleEnv.MAIN_CANARY) throw new Error('Missing MAIN_CANARY.')

  if (!circleEnv.CONTEXT_CANARY) throw new Error('Missing CONTEXT_CANARY. Does this job have the test-runner:env-canary context?')
}

// Returns a map of environment variables defined for this job. `readCircleEnv()` differs from `process.env` - it will
// only return environment variables explicitly specified for this job by CircleCI project env and contexts
// NOTE: this Circle API is not stable, and yet it is the only way to access this information.
async function readCircleEnv () {
  const taskData = await loadInternalTaskData()

  try {
    // if this starts failing, try SSHing into a CircleCI job and see what changed in the $CIRCLE_INTERNAL_CONFIG file's schema
    const circleEnv = taskData['Dispatched']['TaskInfo']['Environment']

    if (!circleEnv) throw new Error('No Environment object was found.')

    // last-ditch effort to check that an empty circle env is accurately reflecting process.env (external PRs)
    if (process.env.COPY_CIRCLE_ARTIFACTS && Object.keys(circleEnv).length === 0) {
      throw new Error('COPY_CIRCLE_ARTIFACTS is set, but circleEnv is empty')
    }

    return circleEnv
  } catch (err) {
    throw new Error(`An error occurred when reading the environment from Circle task data: ${err}`)
  }
}

module.exports = {
  readCircleEnv,
  _checkCanaries: checkCanaries,
}

if (require.main === module) {
  if (process.argv.includes('--check-canaries')) {
    checkCanaries()
  } else {
    console.error(`No options were passed, but ${__filename} was invoked as a script.`)
    process.exit(1)
  }
}
