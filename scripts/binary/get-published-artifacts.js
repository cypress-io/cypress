const fs = require('fs-extra')
const rp = require('@cypress/request-promise')
const util = require('util')
const exec = require('child_process').exec
const minimist = require('minimist')

const execPromise = util.promisify(exec)

const artifactJobName = 'publish-binary'

const artifactPaths = [
  '~/cypress/binary-url.json',
  '~/cypress/npm-package-url.json',
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
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/project/github/cypress-io/publish-binary/${jobNumber}/artifacts`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any artifacts for job ${jobNumber}`)
  }

  return parsed.items
}

async function downloadArtifact (url, path) {
  try {
    console.log(`Downloading artifact from ${url} to path ${path}...`)
    await execPromise(`curl -L --url ${url} --header 'Circle-Token: ${process.env.CIRCLE_TOKEN}' --header 'content-type: application/json' -o ${path}`)
  } catch (error) {
    throw new Error(`failed to fetch artifact from URL ${url}: ${error}`)
  }
}

(async function () {
  const options = minimist(process.argv.slice(2))
  const pipelineInfoFilePath = options.pipelineInfo

  if (!pipelineInfoFilePath) {
    throw new Error('--pipelineInfo must be provided as a parameter')
  }

  console.log(`Parsing pipeline info from ${pipelineInfoFilePath}...`)

  const pipelineId = getPipelineId(pipelineInfoFilePath)

  console.log(`Getting workflows from pipeline ${pipelineId}...`)
  const workflows = await getWorkflows(pipelineId)

  const workflow = workflows[0]

  if (workflow.status !== 'success') {
    throw new Error(`Workflow ${workflow.name} did not succeed. Status: ${workflow.status}. Check the logs for the workflow https://app.circleci.com/pipelines/workflows/${workflow.id}`)
  }

  if (!process.env.SHOULD_PERSIST_ARTIFACTS) {
    console.log('Skipping downloading and persisting build artifacts for this branch...')

    return
  }

  console.log(`Getting jobs from workflow ${workflow.name}...`)
  const jobs = await getWorkflowJobs(workflow.id)

  const job = jobs.find((job) => job.name === artifactJobName)

  if (!job) {
    throw new Error(`unable to find job in workflow ${workflow.name} named ${artifactJobName}`)
  }

  const artifacts = await getJobArtifacts(job.job_number)

  const filteredArtifacts = artifacts.filter((artifact) => artifactPaths.includes(artifact.path))

  await Promise.all(filteredArtifacts.map(({ url, path }) => {
    return downloadArtifact(url, path)
  }))

  console.log('Artifacts successfully downloaded')
})()
