// Given a CircleCI workflow ID and a job name, send a request to approve the approval job
const nodeFetch = require('node-fetch')
const _ = require('lodash')

const verifyCI = () => {
  if (!process.env.CIRCLE_TOKEN) {
    console.error('Cannot find CIRCLE_TOKEN')
    process.exit(1)
  }

  if (!process.env.CIRCLE_PIPELINE_ID) {
    console.error('Cannot find CIRCLE_WORKFLOW_ID')
    process.exit(1)
  }

  if (process.env.CIRCLE_BRANCH !== 'develop') {
    console.error('Only move forward with the release when running on develop.')
    process.exit(1)
  }
}

const getWorkflows = async () => {
  let response
  // const auth = getAuth()
  // typo at https://circleci.com/docs/2.0/api-intro/
  // to retrieve all jobs, the url is "/pipeline/:id/workflow"
  // const url = `https://${auth}@circleci.com/api/v2/pipeline/${pipelineId}/workflow`
  // const response = await got(url).json()

  try {
    response = await nodeFetch(
      `https://circleci.com/api/v2/pipeline/${process.env.CIRCLE_PIPELINE_ID}/workflow`,
      {
        method: 'GET',
        headers: { 'Circle-Token': process.env.CIRCLE_TOKEN },
      },
    )
  } catch (error) {
    throw new Error(`failed to get jobs for workflows ${error}`)
  }

  // returns something like
  // {
  //   "items": [
  //     {
  //       "pipeline_id": "5034460f-c7c4-4c43-9457-de07e2029e7b",
  //       "canceled_by": "026a6d28-c22e-4aab-a8b4-bd7131a8ea35",
  //       "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  //       "name": "build-and-test",
  //       "project_slug": "gh/CircleCI-Public/api-preview-docs",
  //       "errored_by": "c6e40f70-a80a-4ccc-af88-8d985a7bc622",
  //       "tag": "setup",
  //       "status": "success",
  //       "started_by": "03987f6a-4c27-4dc1-b6ab-c7e83bb3e713",
  //       "pipeline_number": "25",
  //       "created_at": "2019-08-24T14:15:22Z",
  //       "stopped_at": "2019-08-24T14:15:22Z"
  //     }
  //   ],
  //   "next_page_token": "string"
  // }
  return response.json().items
}

async function getWorkflowJobs (workflowId) {
  let response

  try {
    response = await nodeFetch(
      `https://circleci.com/api/v2/workflow/${workflowId}/job/`,
      {
        method: 'GET',
        headers: { 'Circle-Token': process.env.CIRCLE_TOKEN },
      },
    )
  } catch (error) {
    throw new Error(`failed to get jobs for workflow ${workflowId} ${error}`)
  }

  return response.json().items
}

async function approveJob (workflowId, approvalJobId) {
  let response

  try {
    response = await nodeFetch(
      `https://circleci.com/api/v2/workflow/${workflowId}/approve/${approvalJobId}`,
      {
        method: 'POST',
        headers: { 'Circle-Token': process.env.CIRCLE_TOKEN },
      },
    )
  } catch (error) {
    throw new Error(`failed to approve job ${approvalJobId} ${error}`)
  }

  return response.json()
}

(async () => {
  verifyCI()

  const approvalJobName = `wait-for-${process.env.CIRCLE_JOB}-workflow-to-pass`

  console.log(`Approving ${approvalJobName} job on the 'linux-x64' workflow.`)

  let workflows = await getWorkflows()

  workflows.sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)

    return dateB - dateA
  })

  // pull the latest one
  workflows = _.uniqBy(workflows, 'name')

  const linuxX64WorkflowId = workflows.find(
    (workflow) => workflow.name === 'linux-x64',
  )?.approval_request_id

  if (process.env.CIRCLE_WORKFLOW_ID === linuxX64WorkflowId) {
    console.log('No need to approve.')
  }

  console.log(`Getting jobs for workflow ${linuxX64WorkflowId}`)

  const jobs = await getWorkflowJobs(linuxX64WorkflowId)

  const approvalJobId = jobs.find(
    (job) => job.name === approvalJobName,
  )?.approval_request_id

  if (!approvalJobId) {
    throw new Error(
      `unable to find job named ${approvalJobName} in workflow ${linuxX64WorkflowId}`,
    )
  }

  console.log(`Approving job ${approvalJobId}...`)

  const approvalResponse = await approveJob(linuxX64WorkflowId, approvalJobId)

  console.log('Finished approving job', approvalResponse)
})()
