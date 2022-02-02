import execa from 'execa'
import path from 'path'
import os from 'os'

import type { DataContext } from '..'

// matches <timestamp> <when> <author>
// $ git log -1 --pretty=format:%ci %ar %an <file>
// eg '2021-09-14 13:43:19 +1000 2 days ago Lachlan Miller
const GIT_LOG_REGEXP = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+].+?)\s(.+ago)\s(.*)/
const GIT_LOG_COMMAND = `git log -1 --pretty="format:%ci %ar %an"`
const GIT_BRANCH_COMMAND = 'git rev-parse --abbrev-ref HEAD'

export interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
}

export class GitDataSource {
  constructor (private ctx: DataContext) {}

  gitInfo (path: string): Promise<GitInfo | null> {
    return this.gitInfoLoader.load(path)
  }

  private gitInfoLoader = this.ctx.loader<string, GitInfo | null>((paths) => {
    return this.bulkGitInfo(paths)
  })

  private async bulkGitInfo (absolutePaths: readonly string[]) {
    if (absolutePaths.length === 0) {
      return []
    }

    try {
      const stdout = await (
        os.platform() === 'win32'
          ? this.getInfoWindows(absolutePaths)
          : this.getInfoPosix(absolutePaths)
      )

      const output: Array<GitInfo | null> = []

      this.ctx.debug('stdout %s', stdout)

      for (let i = 0; i < absolutePaths.length; i++) {
        const file = absolutePaths[i]
        const data = stdout[i]
        const info = data?.match(GIT_LOG_REGEXP)

        if (file && info && info[1] && info[2] && info[3]) {
          output.push({
            lastModifiedTimestamp: info[1],
            lastModifiedHumanReadable: info[2],
            author: info[3],
          })
        } else {
          this.ctx.debug(`did not get expected git log for ${file}, expected string with format '<timestamp> <time_ago> <author>'. Got: ${data}`)
          output.push(null)
        }
      }

      return output
    } catch (e) {
      this.ctx.debug('Error getting git info: %s', (e as Error).message)

      // does not have git installed,
      // file is not under source control
      // ... etc ...
      // just return an empty map
      return new Array(absolutePaths.length).fill(null)
    }
  }

  private async getInfoPosix (absolutePaths: readonly string[]) {
    this.ctx.debug('getting git info for %o:', absolutePaths)
    const paths = absolutePaths.map((x) => `"${path.resolve(x)}"`).join(',')

    // for file in {one,two} is valid in bash, but for file {one} is not
    // no need to use a for loop for a single file
    // IFS is needed to handle paths with white space.
    const cmd = absolutePaths.length === 1
      ? `${GIT_LOG_COMMAND} ${absolutePaths[0]}`
      : `IFS=$'\n'; for file in {${paths}}; do echo $(${GIT_LOG_COMMAND} $file); done`

    this.ctx.debug('executing command `%s`:', cmd)

    const result = await execa(cmd, { shell: true })
    const stdout = result.stdout.split('\n')

    if (stdout.length !== absolutePaths.length) {
      this.ctx.debug('error... stdout:', stdout)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    this.ctx.debug('stdout for git info', stdout)

    return stdout
  }

  private async getInfoWindows (absolutePaths: readonly string[]) {
    const paths = absolutePaths.map((x) => path.resolve(x)).join(',')
    const cmd = `FOR %x in (${paths}) DO (${GIT_LOG_COMMAND} %x)`
    const result = await execa(cmd, { shell: true })

    const split = result.stdout
    .split('\r\n') // windows uses CRLF for carriage returns
    .filter((str) => !str.includes('git log')) // windows stdout contains [cmd,output]. So we remove the code containing the executed command, `git log`

    // windows returns a leading carriage return, remove it
    const [, ...stdout] = split

    if (stdout.length !== absolutePaths.length) {
      this.ctx.debug('stdout', stdout)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    return stdout
  }

  public async getBranch (absolutePath: string) {
    try {
      const { stdout, exitCode = 0 } = await execa(GIT_BRANCH_COMMAND, { shell: true, cwd: absolutePath })

      this.ctx.debug('executing command `%s`:', GIT_BRANCH_COMMAND)
      this.ctx.debug('stdout for git branch', stdout)
      this.ctx.debug('exitCode for git branch', exitCode)

      return exitCode === 0 ? stdout.trim() : null
    } catch (e) {
      this.ctx.debug('Error getting git branch: %s', (e as Error).message)

      return null
    }
  }
}
