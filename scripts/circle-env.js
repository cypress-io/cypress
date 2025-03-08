// check if the project env canary and context canary are both present to verify that this script is reading the right env
function checkCanaries () {
  if (!process.env.CI) console.warn('This script will not work outside of CI.')

  const circleEnv = readCircleEnv()

  if (circleEnv.hasOwnProperty('IS_CONTRIBUTOR_PR')) {
    if (circleEnv.MAIN_CANARY) throw new Error('MAIN_CANARY should not be present in a contributor PR.')

    if (circleEnv.CONTEXT_CANARY) throw new Error('CONTEXT_CANARY should not be present in a contributor PR.')
  } else {
    if (!circleEnv.MAIN_CANARY) throw new Error('Missing MAIN_CANARY.')

    if (!circleEnv.CONTEXT_CANARY) throw new Error('Missing CONTEXT_CANARY. Does this job have the test-runner:env-canary context?')
  }
}

function readCircleEnv () {
  return process.env
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
