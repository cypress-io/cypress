const fs = require('fs-extra')
const rp = require('@cypress/request-promise')
const util = require('util')
const exec = require('child_process').exec
const minimist = require('minimist')
const chalk = require('chalk')

const execPromise = util.promisify(exec)

const getArtifactJobName = (platformKey) => {
  if (platformKey === 'linux-x64') {
    return 'linux-amd-publish-binary'
  }

  return 'publish-binary'
}

const urlPaths = [
  '~/cypress/binary-url.json',
  '~/cypress/npm-package-url.json',
]

const archivePaths = [
  '~/cypress/cypress.zip',
  '~/cypress/cypress.tgz',
]

function getRequestOptions (url) {
  return {
    method: 'GET',
    url,
    headers: { 'Circle-Token': process.env.CIRCLE_TOKEN },
  }
}

function getPipelineId (pipelineInfoFilePath) {
  const data = fs.readFileSync(pipelineInfoFilePath)

  const parsedPipelineId = JSON.parse(data).id

  if (!parsedPipelineId) {
    throw new Error(`error retrieving pipeline id from ${pipelineInfoFilePath}`)
  }

  return parsedPipelineId
}

async function getWorkflows (pipelineId) {
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any workflows in pipeline ${pipelineId}`)
  }

  if (parsed.items.length > 1) {
    console.log(parsed.items)
    throw new Error(`expected pipeline ${pipelineId} to only have one workflow, but it had many`)
  }

  return parsed.items
}

async function getWorkflowJobs (workflowId) {
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/workflow/${workflowId}/job`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any jobs in workflow ${workflowId}`)
  }

  return parsed.items
}

async function getJobArtifacts (jobNumber) {
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/project/github/cypress-io/cypress-publish-binary/${jobNumber}/artifacts`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any artifacts for job ${jobNumber}`)
  }

  return parsed.items
}

async function downloadArtifact (url, path) {
  try {
    console.log(`Downloading artifact from ${chalk.cyan(url)} \n to path ${chalk.cyan(path)}...`)
    await execPromise(`curl -L --url ${url} --header 'Circle-Token: ${process.env.CIRCLE_TOKEN}' --header 'content-type: application/json' -o ${path}`)
  } catch (error) {
    throw new Error(`failed to fetch artifact from URL ${url}: ${error}`)
  }
}

async function run (args) {
  const options = minimist(args)

  const artifactJobName = getArtifactJobName(options.platformKey)

  const pipelineInfoFilePath = options.pipelineInfo

  if (!pipelineInfoFilePath) {
    throw new Error('--pipelineInfo must be provided as a parameter')
  }

  console.log(`Parsing pipeline info from ${chalk.cyan(pipelineInfoFilePath)}...`)

  const pipelineId = module.exports.getPipelineId(pipelineInfoFilePath)

  console.log(`Getting workflows from pipeline ${chalk.cyan(pipelineId)}...`)
  const workflows = await module.exports.getWorkflows(pipelineId)

  const workflow = workflows[0]

  if (workflow.status !== 'success') {
    console.error(chalk.red(`\nThe ${chalk.cyan(workflow.name)} workflow that we triggered in the ${chalk.cyan('cypress-publish-binary')} project did not succeed.\n
Status: ${chalk.red(workflow.status)} \n
Check the workflow logs to see why it failed

${chalk.cyan.underline(`https://app.circleci.com/pipelines/workflows/${workflow.id}`)}
    `))

    process.exitCode = 1

    return
  }

  console.log(`Getting jobs from workflow ${chalk.cyan(workflow.name)}...`)
  const jobs = await module.exports.getWorkflowJobs(workflow.id)

  const job = jobs.find((job) => job.name === artifactJobName)

  if (!job) {
    throw new Error(`unable to find job in workflow ${workflow.name} named ${artifactJobName}`)
  }

  const artifacts = await module.exports.getJobArtifacts(job.job_number)

  let artifactPaths

  if (process.env.SHOULD_PERSIST_ARTIFACTS) {
    artifactPaths = [...urlPaths, ...archivePaths]
  } else {
    // If we didn't persist the artifacts to the registry, then we only want the build artifacts, no URLs.
    artifactPaths = [...archivePaths]
  }

  const filteredArtifacts = artifacts.filter((artifact) => artifactPaths.includes(artifact.path))

  await Promise.all(filteredArtifacts.map(({ url, path }) => {
    return module.exports.downloadArtifact(url, path)
  }))

  console.log('Artifacts successfully downloaded ✅')
}

module.exports = {
  getPipelineId,
  getWorkflows,
  getWorkflowJobs,
  getJobArtifacts,
  downloadArtifact,
  run,
}

if (!module.parent) {
  run(process.argv)
}
