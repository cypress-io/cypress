/* eslint-disable no-console */

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const got = require('got')

const { seconds, minutes } = require('./utils')

const WORKFLOW_NAMES = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  // 'linux-x64', this is the workflow validating this check so leaved commented out
  'windows',
  'setup-workflow',
]

const pipelineId = process.env.CIRCLE_PIPELINE_ID // pulled from <pipeline.id> circleci parameter

const getAuth = () => `${process.env.CIRCLE_TOKEN}:`

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
  const auth = getAuth()
  // typo at https://circleci.com/docs/2.0/api-intro/
  // to retrieve all jobs, the url is "/pipeline/:id/workflow"
  const url = `https://${auth}@circleci.com/api/v2/pipeline/${pipelineId}/workflow`
  const response = await got(url).json()

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
  return response.items
}

const waitForAllWorkflows = async () => {
  let workflows

  try {
    workflows = await getWorkflows()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  workflows.sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)

    return dateB - dateA
  })

  workflows = _.uniqBy(workflows, 'name')

  _.remove(workflows, (w) => w.name === 'linux-x64') // this is the workflow that is running this job

  console.log('workflows', workflows)

  const missingWorkflows = WORKFLOW_NAMES.filter((w) => !_.find(workflows, { name: w }))

  if (missingWorkflows.length) {
    console.error('The following', missingWorkflows.length, 'workflows are required to release and have not been started:\n -', missingWorkflows.join('\n - '))
    console.error('Failing early rather than wait for pipelines to finish.')
    process.exit(1)
  }

  // determine workflow states
  // https://circleci.com/docs/workflows/#states

  // in-progress workflows
  const runningWorkflows = _.filter(workflows, (w) => {
    return ['running', 'on hold'].includes(w.status)
  }).map((w) => w.name)

  // failing workflows
  const failingWorkflows = _.filter(workflows, { status: 'failing' }).map((w) => w.name)

  // failed workflows
  const failedWorkflows = _.filter(workflows, (w) => {
    return ['failed', 'canceled', 'not run', 'needs setup'].includes(w.status)
  }).map((w) => w.name)

  if (_.intersection(WORKFLOW_NAMES, failingWorkflows).length) {
    console.log('failingWorkflows', failingWorkflows)

    console.error('At least one workflow is failing, which has prevented the release from kicking off', failingWorkflows)
    process.exit(1)
  }

  if (_.intersection(WORKFLOW_NAMES, failedWorkflows).length) {
    console.log('failedWorkflows', failedWorkflows)

    console.error('At least one workflow failed, which has prevented the release from kicking off', failedWorkflows)
    process.exit(1)
  }

  const workflowsToWaitFor = _.intersection(WORKFLOW_NAMES, runningWorkflows)

  if (!workflowsToWaitFor.length) {
    console.log('All workflows have finished and passed!')

    return Promise.resolve()
  }

  // logging something every time this runs will avoid CI timing out if there is no activity for 10 mins.
  console.log(`waiting for ${workflowsToWaitFor.length} workflows to finish:\n  - `, workflowsToWaitFor.join('\n  - '))

  return Promise.reject(new Error('One or more workflows has not finished...'))
}

const main = () => {
  verifyCI()

  // https://github.com/demmer/bluebird-retry
  retry(waitForAllWorkflows.bind(null), {
    timeout: minutes(95), // max time for this job
    interval: seconds(90), // poll intervals
    max_interval: seconds(90),
  }).then(() => {
    console.log('all done')
  }, (err) => {
    console.error(err)
    process.exit(1)
  })
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
