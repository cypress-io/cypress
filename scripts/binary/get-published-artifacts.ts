import fs from 'fs-extra'
// @ts-ignore
import rp from '@cypress/request-promise'
import util from 'util'
import { exec } from 'child_process'

const execPromise = util.promisify(exec)

const artifactJobName = 'publish-binary'

const artifactPaths = [
  '~/cypress/binary-url.json',
  '~/cypress/npm-package-url.json',
  '~/cypress/cypress.zip',
  '~/cypress/cypress.tgz',
]

function getRequestOptions (url: string) {
  return {
    method: 'GET',
    url,
    headers: { 'Circle-Token': process.env.CIRCLE_TOKEN },
  }
}

function getPipelineId (pipelineInfoFilePath: string) {
  const data = fs.readFileSync(pipelineInfoFilePath)

  // @ts-ignore
  const parsedPipelineId = JSON.parse(data).id

  if (!parsedPipelineId) {
    throw new Error(`error retrieving pipeline id from ${pipelineInfoFilePath}`)
  }

  return parsedPipelineId
}

async function getWorkflows (pipelineId: string) {
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

async function getWorkflowJobs (workflowId: string) {
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/workflow/${workflowId}/job`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any jobs in workflow ${workflowId}`)
  }

  return parsed.items
}

async function getJobArtifacts (jobNumber: number) {
  const response = await rp(getRequestOptions(`https://circleci.com/api/v2/project/github/cypress-io/publish-binary/${jobNumber}/artifacts`))

  const parsed = JSON.parse(response)

  if (parsed.items.length === 0) {
    throw new Error(`did not find any artifacts for job ${jobNumber}`)
  }

  return parsed.items
}

async function downloadArtifact (url: string, path: string) {
  try {
    console.log(`Downloading artifact from ${url} to path ${path}...`)
    await execPromise(`curl -L --url ${url} --header 'Circle-Token: ${process.env.CIRCLE_TOKEN}' --header 'content-type: application/json' -o ${path}`)
  } catch (error) {
    throw new Error(`failed to fetch artifact from URL ${url}: ${error}`)
  }
}

(async function () {
  const pipelineInfoFilePath = process.argv[2]

  if (!pipelineInfoFilePath) {
    throw new Error('pipelineInfoFilePath must be provided as a parameter')
  }

  console.log(`Parsing pipeline info from ${pipelineInfoFilePath}...`)

  const pipelineId = getPipelineId(pipelineInfoFilePath)

  console.log(`Getting workflows from pipeline ${pipelineId}...`)
  const workflows = await getWorkflows(pipelineId)

  const workflow = workflows[0]

  if (workflow.status !== 'success') {
    throw new Error(`Workflow ${workflow.name} did not succeed. Status: ${workflow.status}. Check the logs for the workflow https://app.circleci.com/pipelines/workflows/${workflow.id}`)
  }

  console.log(`Getting jobs from workflow ${workflow.name}...`)
  const jobs = await getWorkflowJobs(workflow.id)

  const job = jobs.find((job: {name: string}) => job.name === artifactJobName)

  if (!job) {
    throw new Error(`unable to find job in workflow ${workflow.name} named ${artifactJobName}`)
  }

  const artifacts = await getJobArtifacts(job.job_number)

  const filteredArtifacts = artifacts.filter((artifact: {path: string}) => artifactPaths.includes(artifact.path))

  await Promise.all(filteredArtifacts.map(({ url, path }: { url: string, path: string }) => {
    return downloadArtifact(url, path)
  }))

  console.log('Artifacts successfully downloaded')
})()
