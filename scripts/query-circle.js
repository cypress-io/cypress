/* eslint-disable no-console */
if (!process.env.CIRCLE_TOKEN) {
  console.error('Cannot find CIRCLE_TOKEN')
  process.exit(1)
}

if (!process.env.CIRCLE_WORKFLOW_ID) {
  console.error('Cannot find CIRCLE_WORKFLOW_ID')
  process.exit(1)
}

const workflowId = process.env.CIRCLE_WORKFLOW_ID

const getAuth = () => `${process.env.CIRCLE_TOKEN}:`

const got = require('got')

/* eslint-disable-next-line no-unused-vars */
const getWorkflow = async (workflowId) => {
  const auth = getAuth()
  const url = `https://${auth}@circleci.com/api/v2/workflow/${workflowId}`
  const response = await got(url).json()

  // returns something like
  // {
  //   pipeline_id: '5b937e8b-6138-41ad-b8d0-1c1969c4dad1',
  //   id: '566ffe9a-62d4-45cd-9a27-9882139e0121',
  //   name: 'linux',
  //   project_slug: 'gh/cypress-io/cypress',
  //   status: 'failed',
  //   started_by: '45ae8c6a-4686-4e71-a078-fb7a3b9d9e59',
  //   pipeline_number: 12461,
  //   created_at: '2020-07-20T19:45:41Z',
  //   stopped_at: '2020-07-20T20:06:54Z'
  // }

  return response
}

const getWorkflowJobs = async (workflowId) => {
  const auth = getAuth()
  // typo at https://circleci.com/docs/2.0/api-intro/
  // to retrieve all jobs, the url is "/workflow/:id/job"
  const url = `https://${auth}@circleci.com/api/v2/workflow/${workflowId}/job`
  const response = await got(url).json()

  // returns something like
  // {
  //   next_page_token: null,
  //   items: [
  //     {
  //       dependencies: [],
  //       job_number: 400959,
  //       id: '7021bcc7-90c1-47d9-bf99-c0372a4f8f49',
  //       started_at: '2020-07-20T19:45:46Z',
  //       name: 'build',
  //       project_slug: 'gh/cypress-io/cypress',
  //       status: 'success',
  //       type: 'build',
  //       stopped_at: '2020-07-20T19:50:07Z'
  //     }
  //   ]
  // }

  return response
}

// finished, has one failed job
// const workflowId = '566ffe9a-62d4-45cd-9a27-9882139e0121'
// pending workflow
// jobs that have not run have "status: 'blocked'"

// getWorkflow(workflowId).then(console.log, console.error)
getWorkflowJobs(workflowId).then(console.log, console.error)
