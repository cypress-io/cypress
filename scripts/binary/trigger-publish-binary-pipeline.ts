import { exec } from 'child_process'
// import fs from 'fs-extra'
import os from 'os'

const pipelineInfoFilePath = '~/triggered_pipeline.json'

exec(`curl --fail --request POST \
        --url https://circleci.com/api/v2/project/github/cypress-io/publish-binary/pipeline \
        --header 'Circle-Token: ${process.env.CIRCLE_TOKEN}' \
        --header 'content-type: application/json' \
        --output ${pipelineInfoFilePath} \
        --data '{ "parameters": { "temp_dir": "${os.tmpdir()}", "sha": "${process.env.CIRCLE_SHA1}", "job_name": "${process.env.CIRCLE_JOB}", "binary_artifact_url": "https://output.circle-artifacts.com/output/job/${process.env.CIRCLE_WORKFLOW_JOB_ID}/artifacts/${process.env.CIRCLE_NODE_INDEX}/cypress-dist.tgz", "triggered_workflow_id": "${process.env.CIRCLE_WORKFLOW_ID}" }}'
`, (error, stdout) => {
  if (error) {
    throw new Error(`could not trigger publish-binary pipeline ${error}`)
  }

  console.log(stdout)

  // const data = fs.readFileSync(pipelineInfoFilePath)

  // // @ts-ignore
  // const parsedPipelineNumber = JSON.parse(data).number

  // if (!parsedPipelineNumber) {
  //   throw new Error(`error retrieving pipeline number from ${pipelineInfoFilePath}`)
  // }

  // console.log(`Triggered pipeline: https://circleci.com/gh/cypress-io/publish-binary/${parsedPipelineNumber}`)
})
