import path from 'path'
import globby from 'globby'
import fs from 'fs-extra'
import disparity from 'disparity'
import dedent from 'dedent'
import { cyTmpDir } from '@tooling/system-tests/lib/fixtures'

const systemTestsDir = path.join(__dirname, '..', '..', '..', '..', 'system-tests', 'projects')

export interface SnapshotScaffoldTestResult {
  status: 'ok' | 'fail'
  message: string
}

interface FileToDiff {
  actual: string
  expected: string
}

async function snapshotScaffoldedFiles (expectedScaffoldDir: string, filesToDiff: FileToDiff[]): Promise<SnapshotScaffoldTestResult> {
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

function compareScaffoldedFiles (filesToDiff: FileToDiff[]): SnapshotScaffoldTestResult {
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

interface SnapshotCypressDirectoryOptions {
  currentProject: string
  language: 'js' | 'ts'
  testingType: Cypress.TestingType
}

export async function snapshotCypressDirectory ({ currentProject, language, testingType }: SnapshotCypressDirectoryOptions): Promise<SnapshotScaffoldTestResult> {
  if (!currentProject.startsWith(cyTmpDir)) {
    throw Error(dedent`
      snapshotCypressDirectory is designed to be used with system-tests infrastructure.
      It should not be used with projects that are not created in a temporary directory
      by the system-tests infrastructure.
      
      Expected currentProject to be in /tmp. currentProject found at path ${currentProject}`)
  }

  const projectDir = currentProject.replace(cyTmpDir, systemTestsDir)
  const projectName = projectDir.replace(systemTestsDir, '').slice(1)

  const expectedScaffoldDir = path.join(projectDir, `expected-cypress-${language}-${testingType}`)

  const currentProjectPosix = currentProject.split(path.sep).join(path.posix.sep)

  const files = (
    await Promise.all([
      globby(path.join(currentProjectPosix, 'cypress'), { onlyFiles: true }),
      globby(path.join(currentProjectPosix, 'cypress.config.*'), { onlyFiles: true }),
    ])
  ).reduce((acc, curr) => {
    return [acc, curr].flat(2)
  }, [])

  const actualRelativeFiles = files.map((file) => {
    return file.replace(cyTmpDir, '').slice(projectName.length + 2)
  })

  const filesToDiff = actualRelativeFiles.map<FileToDiff>((file) => {
    return {
      actual: path.join(currentProjectPosix, file),
      expected: path.join(expectedScaffoldDir, file),
    }
  })

  if (fs.existsSync(expectedScaffoldDir)) {
    // compare!
    return compareScaffoldedFiles(filesToDiff)
  }

  return snapshotScaffoldedFiles(expectedScaffoldDir, filesToDiff)
}
