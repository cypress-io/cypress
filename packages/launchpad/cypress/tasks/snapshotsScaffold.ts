import path from 'path'
import globby from 'globby'
import fs from 'fs-extra'
import disparity from 'disparity'
import dedent from 'dedent'
import { cyTmpDir } from '@tooling/system-tests'

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
      const read = (f: string) => fs.readFileSync(f, 'utf-8').trim().replaceAll('\r\n', '\n')
      const actualContent = read(actual)
      const expectedContent = read(expected)
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
  ctFramework?: string
  customDirectory?: string
}

function removeHyphensAndBrackets (str: string) {
  return str.toLowerCase().replaceAll(' ', '-').replaceAll('(', '').replaceAll(')', '')
}

export async function snapshotCypressDirectory ({ currentProject, language, testingType, ctFramework, customDirectory }: SnapshotCypressDirectoryOptions): Promise<SnapshotScaffoldTestResult> {
  if (!currentProject.startsWith(cyTmpDir)) {
    throw Error(dedent`
      snapshotCypressDirectory is designed to be used with system-tests infrastructure.
      It should not be used with projects that are not created in a temporary directory
      by the system-tests infrastructure.
      
      Expected currentProject to be in /tmp. currentProject found at path ${currentProject}`)
  }

  const projectDir = currentProject.replace(cyTmpDir, systemTestsDir)

  let expectedScaffoldDir = path.join(projectDir, `expected-cypress-${language}-${testingType}`)

  if (ctFramework) {
    expectedScaffoldDir += `-${removeHyphensAndBrackets(ctFramework)}`
  }

  if (customDirectory) {
    expectedScaffoldDir += `-${customDirectory}`
  }

  const joinPosix = (...s: string[]) => path.join(...s).split(path.sep).join(path.posix.sep)

  const files = (
    await Promise.all([
      globby(joinPosix(expectedScaffoldDir, 'cypress'), { onlyFiles: true }),
      globby(joinPosix(expectedScaffoldDir, 'cypress.config.*'), { onlyFiles: true }),
    ])
  ).reduce((acc, curr) => {
    return [acc, curr].flat(2)
  }, [])

  const expectedRelativeFiles = files.map((file) => {
    const cyTmpDirPosix = joinPosix(expectedScaffoldDir)

    return file.replace(cyTmpDirPosix, '').slice(1)
  })

  const filesToDiff = expectedRelativeFiles.map<FileToDiff>((file) => {
    return {
      actual: joinPosix(path.join(currentProject, file)),
      expected: joinPosix(path.join(expectedScaffoldDir, file)),
    }
  })

  if (fs.existsSync(expectedScaffoldDir)) {
    // compare!
    return compareScaffoldedFiles(filesToDiff)
  }

  return snapshotScaffoldedFiles(expectedScaffoldDir, filesToDiff)
}
