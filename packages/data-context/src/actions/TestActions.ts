import path from 'path'
import globby from 'globby'
import assert from 'assert'
import fs from 'fs-extra'
import disparity from 'disparity'
import { cyTmpDir } from '@tooling/system-tests/lib/fixtures'

import type { DataContext } from '..'

const systemTestsDir = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects')

interface SnapshotScaffoldTestResult {
  status: 'ok' | 'fail'
  message: string
}

export class TestActions {
  constructor (private ctx: DataContext) {}

  async snapshotCypressDirectory (): Promise<SnapshotScaffoldTestResult> {
    assert(this.ctx.currentProject)

    if (this.ctx.currentProject.startsWith(cyTmpDir)) {
      const projectDir = this.ctx.currentProject.replace(cyTmpDir, systemTestsDir)
      const projectName = projectDir.replace(systemTestsDir, '').slice(1)

      const expectedScaffoldDir = path.join(projectDir, 'expected-cypress')

      const files = (
        await Promise.all([
          globby(path.join(this.ctx.currentProject, 'cypress'), {
            onlyFiles: true,
          }),
          globby(path.join(this.ctx.currentProject, 'cypress.config.*'), {
            onlyFiles: true,
          }),
        ])
      ).reduce((acc, curr) => {
        return [acc, curr].flat(2)
      }, [])

      const actualRelativeFiles = files.map((file) => {
        return file.replace(cyTmpDir, '').slice(projectName.length + 2)
      })

      const filesToDiff = actualRelativeFiles.map((file) => {
        return {
          actual: path.join(this.ctx.currentProject!, file),
          expected: path.join(expectedScaffoldDir, file),
        }
      })

      if (fs.existsSync(expectedScaffoldDir)) {
        // compare!
        for (const { actual, expected } of filesToDiff) {
          try {
            const read = (f: string) => fs.readFileSync(f, 'utf-8')
            const actualContent = read(actual)
            const expectedContent = read(expected)
            const diff = disparity.unifiedNoColor(actualContent, expectedContent, {})

            if (diff !== '') {
              return {
                status: 'fail',
                message: `Expected contents of ${actual} and ${expected} to match. Diff: ${diff}`,
              }
            }
          } catch (e) {
            if (e.code === 'ENOENT') {
              return {
                status: 'fail',
                message: `Expected ${e.path} to exist, but it was not found`,
              }
            }

            return {
              status: 'fail',
              message: `Unexpected error: ${e.message}`,
            }
          }
        }
      } else {
        // see if existing snapshots exist compared to source
        // project in `system-tests/projects`
        // expected-scaffold
        fs.mkdirSync(expectedScaffoldDir)

        await Promise.all(filesToDiff.map(async (files) => {
          const { expected, actual } = files

          await fs.ensureFile(expected)
          await fs.copy(actual, expected)
          await fs.copy(actual, expected)
        }))

        return {
          status: 'ok',
          message: `Created expected files based on test`,
        }
      }
    }

    return {
      status: 'ok',
      message: 'Scaffolded files matched expected files',
    }
  }
}
