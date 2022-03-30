import execa from 'execa'
import simpleGit from 'simple-git'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import Debug from 'debug'
import type { DataContext } from '..'
import type { gitStatusType } from '@packages/types'

const debug = Debug('cypress:data-context:GitDataSource')

dayjs.extend(relativeTime)

// We get the last modified time for each spec
// using a shell command. The reason is
// none of the Node.js git wrappers support
// bulk fetching the last modified date and user.
// Doing them one by one in a Node.js for loop is way too slow.
// The fastest way to do it is using a shell command,
// looping over each spec and processing the result of `git log`
// The command is slightly different between macOS/Linux and Windows.
// macOS/Linux: getInfoPosix
// Windows: getInfoWindows
// Where possible, we use SimpleGit to get other git info, like
// the status of untracked files and the current git username.

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
  statusType: typeof gitStatusType[number]
}

export class GitDataSource {
  constructor (private ctx: DataContext) {}

  get #git () {
    return simpleGit()
  }

  async getCurrentGitUser () {
    try {
      return (await this.#git.getConfig('user.name')).value
    } catch (e) {
      debug(`Failed to get current git user`, (e as Error).message)

      return ''
    }
  }

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

      const unstaged = await this.#git.status()

      const output: Array<GitInfo | null> = []

      debug('stdout %s', stdout)

      for (let i = 0; i < absolutePaths.length; i++) {
        const file = absolutePaths[i]

        if (!file) {
          continue
        }

        // first check unstaged/untracked files
        const isUnstaged = unstaged.files.find((x) => file.endsWith(x.path))

        // These are the status codes used by SimpleGit.
        // M -> modified
        // ? -> unstaged
        // A or ' ' -> staged, but not yet committed
        // D -> deleted, but we do not show deleted files in the UI, so it's not used.
        if (isUnstaged && ['M', 'A', ' ', '?'].includes(isUnstaged?.working_dir)) {
          const stat = fs.statSync(file)
          const ctime = dayjs(stat.ctime)

          output.push({
            lastModifiedTimestamp: ctime.format('YYYY-MM-DD HH:mm:ss Z'),
            lastModifiedHumanReadable: ctime.fromNow(),
            author: await this.getCurrentGitUser(),
            statusType: isUnstaged.working_dir === 'M' ? 'modified' : 'created',
          })
        } else {
          const data = stdout[i]
          const info = data?.match(GIT_LOG_REGEXP)

          if (file && info && info[1] && info[2] && info[3]) {
            output.push({
              lastModifiedTimestamp: info[1],
              lastModifiedHumanReadable: info[2],
              author: info[3],
              statusType: 'unmodified',
            })
          } else {
            debug(`did not get expected git log for ${file}, expected string with format '<timestamp> <time_ago> <author>'. Got: ${data}`)
            output.push(null)
          }
        }
      }

      return output
    } catch (e) {
      debug('Error getting git info: %s', e)

      // does not have git installed,
      // file is not under source control
      // ... etc ...
      // just return an empty map
      return new Array(absolutePaths.length).fill(null)
    }
  }

  private async getInfoPosix (absolutePaths: readonly string[]) {
    debug('getting git info for %o:', absolutePaths)
    const paths = absolutePaths.map((x) => `"${path.resolve(x)}"`).join(',')

    // for file in {one,two} is valid in bash, but for file {one} is not
    // no need to use a for loop for a single file
    // IFS is needed to handle paths with white space.
    const cmd = absolutePaths.length === 1
      ? `${GIT_LOG_COMMAND} ${absolutePaths[0]}`
      : `IFS=$'\n'; for file in {${paths}}; do echo $(${GIT_LOG_COMMAND} $file); done`

    debug('executing command `%s`:', cmd)

    const result = await execa(cmd, { shell: process.env.SHELL || '/bin/bash' })
    const stdout = result.stdout.split('\n')

    if (stdout.length !== absolutePaths.length) {
      debug('error... stdout:', stdout)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    debug('stdout for git info', stdout)

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
      debug('stdout', stdout)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    return stdout
  }

  public async getBranch (absolutePath: string) {
    try {
      const { stdout, exitCode = 0 } = await execa(GIT_BRANCH_COMMAND, { shell: true, cwd: absolutePath })

      debug('executing command `%s`:', GIT_BRANCH_COMMAND)
      debug('stdout for git branch', stdout)
      debug('exitCode for git branch', exitCode)

      return exitCode === 0 ? stdout.trim() : null
    } catch (e) {
      debug('Error getting git branch: %s', (e as Error).message)

      return null
    }
  }
}
