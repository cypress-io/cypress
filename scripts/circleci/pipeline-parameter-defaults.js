const fs = require('fs')
const path = require('path')
const yaml = require('yaml')

const REPO_ROOT = path.join(__dirname, '../..')

const RUN_ALL_JOBS_CONFIGS = [
  '.circleci/config.yml',
  '.circleci/src/pipeline/@pipeline.yml',
]

/**
 * Reads the default value of run-all-jobs from a CircleCI config file.
 * @param {string} configPath absolute path to a YAML config
 * @returns {boolean | null} default when declared, otherwise null
 */
function getRunAllJobsDefault (configPath) {
  const content = fs.readFileSync(configPath, 'utf8')
  const doc = yaml.parse(content)
  const param = doc?.parameters?.['run-all-jobs']

  if (!param) {
    return null
  }

  return param.default
}

/**
 * Ensures run-all-jobs defaults to false everywhere it is declared.
 * A true default disables PR path filtering because CircleCI injects pipeline
 * parameter defaults into the environment for generate-pipeline-parameters.sh.
 */
function assertRunAllJobsDefaultsFalse () {
  const errors = []

  for (const rel of RUN_ALL_JOBS_CONFIGS) {
    const full = path.join(REPO_ROOT, rel)

    if (!fs.existsSync(full)) {
      continue
    }

    const def = getRunAllJobsDefault(full)

    if (def === null) {
      errors.push(`${rel}: must declare run-all-jobs with default: false`)
      continue
    }

    if (def !== false) {
      errors.push(`${rel}: run-all-jobs default must be false (got ${JSON.stringify(def)})`)
    }
  }

  if (errors.length) {
    throw new Error(errors.join('\n'))
  }
}

module.exports = {
  RUN_ALL_JOBS_CONFIGS,
  getRunAllJobsDefault,
  assertRunAllJobsDefaultsFalse,
}
