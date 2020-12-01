/* eslint-disable no-console */

const _ = require('lodash')
const minimist = require('minimist')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const got = require('got')
// always print the debug logs
const debug = require('debug')('*')

const { seconds, minutes } = require('./utils')

// we expect CircleCI to set the current polling job name
const jobName = process.env.CIRCLE_JOB || 'wait-on-circle-jobs'

const workflowId = process.env.CIRCLE_WORKFLOW_ID

const getAuth = () => `${process.env.CIRCLE_TOKEN}:`

const verifyCI = () => {
  if (!process.env.CIRCLE_TOKEN) {
    console.error('Cannot find CIRCLE_TOKEN')
    process.exit(1)
  }

  if (!process.env.CIRCLE_WORKFLOW_ID) {
    console.error('Cannot find CIRCLE_WORKFLOW_ID')
    process.exit(1)
  }
}

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
const getJobStatus = async (workflowId) => {
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

const waitForAllJobs = async (jobNames, workflowId) => {
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

  const blockedJobNames = _.map(blockedJobs, 'name')
  const runningJobNames = _.map(runningJobs, 'name')

  debug('failed jobs %o', _.map(failedJobs, 'name'))
  debug('blocked jobs %o', blockedJobNames)
  debug('running jobs %o', runningJobNames)

  if (!runningJobs.length || (runningJobs.length === 1 && runningJobs[0].name === jobName)) {
    // there are no more jobs to run, or this is the last running job
    console.log('all jobs are done, finishing this job')

    return Promise.resolve()
  }

  const futureOrRunning = _.union(blockedJobs, runningJobNames)
  const jobsToWaitFor = _.intersection(jobNames, futureOrRunning)

  debug('jobs to wait for %o', jobsToWaitFor)

  if (!jobsToWaitFor.length) {
    console.log('No more jobs to wait for!')

    return Promise.resolve()
  }

  return Promise.reject(new Error('Jobs have not finished'))
}

const waitForJobToPass = Promise.method(async (jobName, workflow = workflowId) => {
  verifyCI()

  let response

  try {
    response = await getJobStatus(workflow)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const job = _.find(response.items, { name: jobName })

  if (!job) {
    return Promise.reject(new Error('Job not found'))
  }

  const { status } = job

  if (status === 'success') {
    return Promise.resolve()
  }

  if (status === 'failed') {
    return Promise.reject(new Error('Job failed'))
  }

  await Promise.delay(seconds(30))

  return waitForJobToPass(jobName, workflow)
})

const main = () => {
  verifyCI()

  const args = minimist(process.argv.slice(2), { boolean: false })

  const jobNames = _
  .chain(args['job-names'])
  .split(',')
  .without('true')
  .map(_.trim)
  .compact()
  .value()

  if (!jobNames.length) {
    console.error('Missing argument: --job-names')
    console.error('You must pass a comma separated list of Circle CI job names to wait for.')
    process.exit(1)
  }

  debug('received circle jobs: %o', jobNames)

  // finished, has one failed job
  // const workflowId = '566ffe9a-62d4-45cd-9a27-9882139e0121'
  // pending workflow
  // jobs that have not run have "status: 'blocked'"

  // getWorkflow(workflowId).then(console.log, console.error)
  // getWorkflowJobs(workflowId).then(console.log, console.error)

  // https://github.com/demmer/bluebird-retry
  retry(waitForAllJobs.bind(null, jobNames, workflowId), {
    timeout: minutes(30), // max time for this job
    interval: seconds(30), // poll intervals
    max_interval: seconds(30),
  }).then(() => {
    console.log('all done')
  }, (err) => {
    console.error(err)
    process.exit(1)
  })

  // getJobStatus(workflowId).then(console.log, console.error)
}

// execute main function if called from command line
if (require.main === module) {
  main()
}

module.exports = {
  minutes,
  waitForJobToPass,
}
