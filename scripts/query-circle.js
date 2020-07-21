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

const Promise = require('bluebird')
const retry = require('bluebird-retry')
const got = require('got')
const _ = require('lodash')

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

/**
 * Job status
 *  - blocked (has not run yet)
 *  - running (currently running)
 *  - failed | success
*/
const getJobStatus = async (workfowId) => {
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

const jobName = (job) => `- ${job.name}`

const printJobs = (jobs) => {
  console.log(jobs.map(jobName).join('\n'))
}

const waitForAllJobs = async (workflowId) => {
  let response

  try {
    response = await getJobStatus(workflowId)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  // if a job is pending, its status will be "blocked"
  const blockedJobs = _.filter(response.items, { status: 'blocked' })
  const failedJobs = _.filter(response.items, { status: 'failed' })
  const runningJobs = _.filter(response.items, { status: 'running' })

  console.log('')
  console.log('*** failed jobs ***')
  printJobs(failedJobs)

  console.log('*** blocked jobs ***')
  printJobs(blockedJobs)

  console.log('*** running jobs ***')
  printJobs(runningJobs)

  if (runningJobs.length === 1 && runningJobs[0].name === 'Poll CircleCI') {
    // this job only!
    console.log('all jobs are done, finishing this job')

    return Promise.resolve()
  }

  return Promise.reject(new Error('Jobs have not finished'))
}

// finished, has one failed job
// const workflowId = '566ffe9a-62d4-45cd-9a27-9882139e0121'
// pending workflow
// jobs that have not run have "status: 'blocked'"

// getWorkflow(workflowId).then(console.log, console.error)
// getWorkflowJobs(workflowId).then(console.log, console.error)

const seconds = (s) => s * 1000
const minutes = (m) => m * 60 * 1000

// https://github.com/demmer/bluebird-retry
retry(waitForAllJobs.bind(null, workflowId), {
  timeout: minutes(20),
  interval: seconds(30),
  max_interval: seconds(30),
}).then(() => {
  console.log('all done')
}, (err) => {
  console.error(err)
  process.exit(1)
})

// getJobStatus(workflowId).then(console.log, console.error)
