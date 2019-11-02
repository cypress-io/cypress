import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as crypto from 'crypto'

const e2e = require('../support/helpers/e2e')

describe('e2e project dir access', function () {
  e2e.setup()
  let projectDir: string

  beforeEach(() => {
    const tmpdir = os.tmpdir()

    // get a random dir that dosen't clash with other runs
    projectDir = path.join(tmpdir, crypto.randomBytes(4).toString('hex'))

    // write out the project structure
    // we cant sue one define by source code since we need to modify the file permissions on the dir and files
    fs.mkdirSync(path.join(projectDir))
    fs.mkdirSync(path.join(projectDir, 'cypress'))
    fs.mkdirSync(path.join(projectDir, 'cypress', 'integration'))
    fs.writeFileSync(path.join(projectDir, 'cypress', 'integration', 'spec.js'), `it('test',() => expect(true).to.be.true )`)

    // setup the file/folder permissions
    // 500 means individual read + execute
    // the dir needs executable for debugging
    // the main test here is that it isn't writable, which would be either 6 or 7
    // See here for more info on these numbers http://permissions-calculator.org/
    const readExe = 0o500

    fs.chmodSync(path.join(projectDir), readExe)
    fs.chmodSync(path.join(projectDir, 'cypress'), readExe)
    fs.chmodSync(path.join(projectDir, 'cypress', 'integration'), readExe)
    fs.chmodSync(path.join(projectDir, 'cypress', 'integration', 'spec.js'), readExe)

    // test that we setup the folder structure correctly
    let err: any

    try {
      fs.accessSync(projectDir, fs.constants.W_OK)
    } catch (e) {
      err = e
    }
    expect(err).to.not.be.undefined
  })

  e2e.it('warns when unable to write to dir', {
    project: projectDir,
    spec: 'spec.js',
    browser: 'chrome',
    expectedExitCode: 1,
    snapshot: true,
  })
})
