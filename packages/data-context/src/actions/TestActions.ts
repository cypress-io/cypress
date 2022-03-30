import path from 'path'
import globby from 'globby'
import assert from 'assert'
import fs from 'fs-extra'
import disparity from 'disparity'
import tempDir from 'temp-dir'

// Also defined in lib/fixtures, but we do not want to
// import from system-tests into code we ship in production.
const cyTmpDir = path.join(tempDir, 'cy-projects')

import type { DataContext } from '..'
import dedent from 'dedent'

const systemTestsDir = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects')

interface SnapshotScaffoldTestResult {
  status: 'ok' | 'fail'
  message: string
}

interface FileToDiff {
  actual: string
  expected: string
}

export class TestActions {
  constructor (private ctx: DataContext) {}

  async #snapshotScaffoldedFiles (expectedScaffoldDir: string, filesToDiff: FileToDiff[]): Promise<SnapshotScaffoldTestResult> {
    // see if existing snapshots exist compared to source
    // project in `system-tests/projects`
    // expected-cypress-{'js' | 'ts'}
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

  #compareScaffoldedFiles (filesToDiff: FileToDiff[]): SnapshotScaffoldTestResult {
    for (const { actual, expected } of filesToDiff) {
      try {
        const read = (f: string) => fs.readFileSync(f, 'utf-8')
        const actualContent = read(actual).trim()
        const expectedContent = read(expected).trim()
        const diff = disparity.unifiedNoColor(actualContent, expectedContent, {})

        if (diff !== '') {
          return {
            status: 'fail',
            message: `Expected contents of ${actual} and ${expected} to match. Diff: ${diff}`,
          }
        }
      } catch (err) {
        const e = err as NodeJS.ErrnoException

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

    return {
      status: 'ok',
      message: 'Scaffolded files matched expected files',
    }
  }

  async snapshotCypressDirectory (): Promise<SnapshotScaffoldTestResult> {
    assert(this.ctx.currentProject)

    if (!this.ctx.currentProject.startsWith(cyTmpDir)) {
      throw Error(dedent`
                  snapshotCypressDirectory is designed to be used with system-tests infrastructure.
                    It should not be used with projects that are not created in a temporary directory
                  by the system-tests infrastructure.`)
    }

    const projectDir = this.ctx.currentProject.replace(cyTmpDir, systemTestsDir)
    const projectName = projectDir.replace(systemTestsDir, '').slice(1)

    const expectedScaffoldDir = path.join(projectDir, `expected-cypress-${this.ctx.coreData.wizard.chosenLanguage}-${this.ctx.coreData.currentTestingType}`)

    const files = (
      await Promise.all([
        globby(path.join(this.ctx.currentProject, 'cypress'), { onlyFiles: true }),
        globby(path.join(this.ctx.currentProject, 'cypress.config.*'), { onlyFiles: true }),
      ])
    ).reduce((acc, curr) => {
      return [acc, curr].flat(2)
    }, [])

    const actualRelativeFiles = files.map((file) => {
      return file.replace(cyTmpDir, '').slice(projectName.length + 2)
    })

    const filesToDiff = actualRelativeFiles.map<FileToDiff>((file) => {
      return {
        actual: path.join(this.ctx.currentProject!, file),
        expected: path.join(expectedScaffoldDir, file),
      }
    })

    if (fs.existsSync(expectedScaffoldDir)) {
      // compare!
      return this.#compareScaffoldedFiles(filesToDiff)
    }

    return this.#snapshotScaffoldedFiles(expectedScaffoldDir, filesToDiff)
  }
}
