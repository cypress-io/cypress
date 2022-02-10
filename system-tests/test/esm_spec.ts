import fs from 'fs'
import chokidar from 'chokidar'
import path from 'path'

import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('esm project', () => {
  systemTests.setup()

  systemTests.it('can run in esm projects', {
    project: 'esm-project',
    spec: 'app_spec.js',
    config: {
      video: false,
    },
    onStdout (stdout) {
      if (stdout.includes('(Run Finished)')) {
        throw new Error('Uncaught')
      }
    },
    onRun (exec) {
      const packageJson = path.join(Fixtures.project('esm-project'), 'cypress', 'package.json')
      const watcher = chokidar.watch(packageJson)
      const evts: string[] = []

      watcher.on('all', (evt) => {
        evts.push(evt)
        if (evt === 'add') {
          expect(JSON.parse(fs.readFileSync(packageJson, 'utf8'))).to.eql({
            'NOTE': 'Added by Cypress to guard against the type: "module" in your project root package.json. Will be removed on process exit',
          })
        }
      })

      return exec().finally(() => {
        watcher.close()
        expect(fs.existsSync(packageJson)).to.eq(false)
        expect(evts).to.eql(['add', 'unlink'])
      })
    },
  })
})
