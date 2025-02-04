const fs = require('fs')
const yaml = require('yaml')

/**
 * from root of directory run:
 *    node ./scripts/format-workflow-file.js
 *
 * This will get executed with as the pre-commit hook in husky to make sure the workflow file is always formatted correctly
 */
const formatWorkflowFile = () => {
  // file path is relative to repo root
  const doc = yaml.parseDocument(fs.readFileSync('./.circleci/workflows.yml', 'utf8'))

  fs.writeFileSync('./.circleci/workflows.yml', yaml.stringify(doc), 'utf8')
}

formatWorkflowFile()
