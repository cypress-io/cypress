import childProcess from 'child_process'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { expect } from 'chai'

// The config child is forked with the tsx CJS hook registered (see ProjectConfigIpc),
// so every dependency loaded during setupNodeEvents runs through tsx's CJS transform.
// tsx must shim import.meta even when a comment sits between `import` and `.meta` —
// @babel/helper-define-polyfill-provider@1.x (pulled in by @angular-devkit/build-angular 22.1)
// ships `createRequire(import /*::(_)*/.meta.url)`, which crashed unshimmed:
// https://github.com/babel/babel-polyfills/blob/%40babel/helper-define-polyfill-provider%401.0.0/packages/babel-helper-define-polyfill-provider/src/node/dependencies.ts#L5
// Fixed upstream in tsx 4.23.12 (https://github.com/cypress-io/cypress/issues/34461).
describe('tsx CJS hook ESM interop', () => {
  let projectDir: string

  beforeEach(async () => {
    projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tsx-esm-interop-'))

    await fs.writeJson(path.join(projectDir, 'package.json'), { type: 'module' })

    await fs.writeFile(path.join(projectDir, 'esm.js'), [
      `import { createRequire } from 'module'`,
      `export default createRequire(import /*::(_)*/.meta.url)`,
    ].join('\n'))

    await fs.writeFile(path.join(projectDir, 'entry.cjs'), `require('./esm.js')`)
  })

  afterEach(() => {
    return fs.remove(projectDir)
  })

  it('loads an ESM-only module that reads import.meta through an inline comment', function (done) {
    this.timeout(15_000)

    const child = childProcess.spawn(process.execPath, [path.join(projectDir, 'entry.cjs')], {
      env: {
        ...process.env,
        NODE_OPTIONS: '--import tsx',
      },
    })

    let stderr = ''

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', done)

    child.on('exit', (code) => {
      try {
        expect(code, `child exited with code ${code}, stderr:\n${stderr}`).to.equal(0)
        done()
      } catch (err) {
        done(err)
      }
    })
  })
})
