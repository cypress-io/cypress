const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const fetch = require('node-fetch')

;(async () => {
  const pipelineInfoFilePath = path.join(os.homedir(), 'triggered_pipeline.json')

  const body = JSON.stringify({
    parameters: {
      temp_dir: os.tmpdir(),
      sha: process.env.CIRCLE_SHA1,
      job_name: process.env.CIRCLE_JOB,
      binary_artifact_url: `https://output.circle-artifacts.com/output/job/${process.env.CIRCLE_WORKFLOW_JOB_ID}/artifacts/${process.env.CIRCLE_NODE_INDEX}/cypress-dist.tgz`,
      triggered_workflow_id: process.env.CIRCLE_WORKFLOW_ID,
      triggered_job_url: process.env.CIRCLE_BUILD_URL,
      branch: process.env.CIRCLE_BRANCH,
      should_persist_artifacts: process.env.SHOULD_PERSIST_ARTIFACTS,
    },
  })

  try {
    console.log('Triggering new pipeline in publish-binary project...')
    const response = await fetch('https://circleci.com/api/v2/project/github/cypress-io/publish-binary/pipeline', { method: 'POST', headers: { 'Circle-Token': process.env.CIRCLE_TOKEN, 'content-type': 'application/json' }, body })
    const pipeline = await response.json()

    console.log(`Triggered pipeline: https://app.circleci.com/pipelines/github/cypress-io/publish-binary/${pipeline.number}`)

    try {
      console.log(`Saving pipeline info in ${pipelineInfoFilePath} ...`)

      await fs.writeFile(path.resolve(pipelineInfoFilePath), JSON.stringify(pipeline))
    } catch (error) {
      throw new Error(`error writing triggered pipeline info ${error}`)
    }
  } catch (error) {
    throw new Error(`error triggering new pipeline ${error}`)
  }
})()
