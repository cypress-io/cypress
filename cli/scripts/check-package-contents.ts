import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'

// Well above the current file count, but far below what a whole dependency's
// typings or a duplicated adapter would add
export const MAX_PACKAGE_FILES = 150

export function findPackageContentProblems (files: string[], maxFiles: number = MAX_PACKAGE_FILES): string[] {
  const problems: string[] = []

  if (files.length > maxFiles) {
    problems.push(`the package contains ${files.length} files, more than the ceiling of ${maxFiles}`)
  }

  const nested = files.filter((file) => {
    const [first, second] = file.split('/')

    return second !== undefined && first === second
  })

  if (nested.length) {
    problems.push(`these files are nested in a folder of the same name, a sign of a copy into an existing folder:\n  ${nested.join('\n  ')}`)
  }

  return problems
}

// npm refuses to pack inside this monorepo because the root package.json uses
// yarn's object-style "workspaces", so pack a copy from outside the repo
async function listPackedFiles (buildDir: string): Promise<string[]> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cypress-pack-'))

  try {
    const pkgDir = path.join(tmpDir, 'package')

    await fs.copy(buildDir, pkgDir)

    const stdout = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: pkgDir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    const [result] = JSON.parse(stdout)

    return result.files.map((file: { path: string }) => file.path)
  } finally {
    await fs.remove(tmpDir)
  }
}

if (require.main === module) {
  listPackedFiles(path.join(__dirname, '..', 'build'))
  .then((files) => {
    const problems = findPackageContentProblems(files)

    if (problems.length) {
      console.error(`The cypress npm package has unexpected contents:\n- ${problems.join('\n- ')}`)
      process.exit(1)
    }

    console.log(`The cypress npm package contains ${files.length} files`)
  })
  .catch((err: unknown) => {
    console.error('Could not check the cypress npm package contents')
    console.error(err)
    process.exit(1)
  })
}
