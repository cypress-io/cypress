// check if the project env canary and context canary are both present to verify that this script is reading the right env
function checkCanaries ({ isContributorPR }) {
  if (!process.env.CI) console.warn('This script will not work outside of CI.')

  const circleEnv = readProcessEnv()

  if (isContributorPR) {
    console.log('Contributor PR detected. Verifying canary envs are not available.')
    if (circleEnv.MAIN_CANARY) throw new Error('MAIN_CANARY should not be present in a contributor PR. Investigate why the CircleCI project level env var is being applied to this job.')

    if (circleEnv.CONTEXT_CANARY) throw new Error('CONTEXT_CANARY should not be present in a contributor PR. Investigate why the test-runner:env-canary CircleCI context is being applied to this job.')

    console.log('Contributor PR canaries checked and passed.')
  } else {
    console.log('Internal PR detected. Verifying canary envs are present.')
    if (!circleEnv.MAIN_CANARY) throw new Error('Missing MAIN_CANARY env var which is used to ensure we are accessing the correct env vars in our CircleCI jobs. This env var should be defined in the CircleCI project settings. Investigate why it is missing.')

    if (!circleEnv.CONTEXT_CANARY) throw new Error('Missing CONTEXT_CANARY env var which is used to ensure we are accessing the correct env vars in our CircleCI jobs. This env var should be defined in the test-runner:env-canary CircleCI context. Ensure this job has the test-runner:env-canary context applied.')

    console.log('Internal PR canaries checked and passed.')
  }
}

function readProcessEnv () {
  return process.env
}

module.exports = {
  readProcessEnv,
  _checkCanaries: checkCanaries,
}

if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length !== 3 || args[0] !== '--check-canaries' || args[1] !== '--is-contributor-pr') {
    console.error(`Invalid arguments. Usage: ${__filename} --check-canaries --is-contributor-pr <isContributorPR>`)
    process.exit(1)
  }

  const isContributorPR = args[2] === 'true'

  checkCanaries({ isContributorPR })
}
