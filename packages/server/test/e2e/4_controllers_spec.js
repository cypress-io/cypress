const fs = require('fs-extra')
const path = require('path')

const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const nonExistentSpec = Fixtures.projectPath('non-existent-spec')
const e2eProject = Fixtures.projectPath('e2e')

describe('e2e plugins', () => {
  e2e.setup()

  it('fails when spec does not exist', function () {
    return e2e.exec(this, {
      spec: 'spec.js',
      project: nonExistentSpec,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('handles specs with $, &, ? in file name', function () {
    let relativeSpecPath = path.join('d?ir&1%', '%di?r2&', 's%pec&?.js')

    // windows doesn't support ? in file names
    if (process.platform === 'win32') {
      relativeSpecPath = specPath.replace(/\?/, '')
    }

    const specPath = path.join(e2eProject, 'cypress', 'integration', relativeSpecPath)

    return fs.outputFile(specPath, 'it(\'passes\', () => {})')
    .then(() => {
      return e2e.exec(this, {
        spec: specPath,
        sanitizeScreenshotDimensions: true,
      })
    }).then(({ stdout }) => {
      expect(stdout).to.include(`1 found (${relativeSpecPath})`)
      expect(stdout).to.include(`Running:  ${relativeSpecPath}`)

      expect(stdout).to.include(`Finished processing: /XXX/XXX/XXX/cypress/videos/${relativeSpecPath}.mp4`)
    })
  })
})
