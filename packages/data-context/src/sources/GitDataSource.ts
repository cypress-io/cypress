import execa from 'execa'
import simpleGit from 'simple-git'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import Debug from 'debug'
import type { gitStatusType } from '@packages/types'
import chokidar from 'chokidar'
import _ from 'lodash'

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
const GIT_ROOT_DIR_COMMAND = '--show-toplevel'

export interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
  statusType: typeof gitStatusType[number]
}

export interface GitDataSourceConfig {
  projectRoot: string
  onBranchChange(branch: string | null): void
  /**
   * Called when we've updated the gitInfo for a given spec
   */
  onGitInfoChange(specPath: string[]): void
  onError(err: any): void
}

/**
 * This acts as the manager for all "git" related state for a
 * given project. It caches the git state internally in the class,
 * and manages the watchers & emitting when things are changed. This way,
 * we are loading the git info ahead of time, and not blocking the execution
 * of the Queries on any git data loading lazily
 */
export class GitDataSource {
  #git = simpleGit({ baseDir: this.config.projectRoot })
  #gitError = false
  #destroyed = false
  #gitBaseDir?: string
  #gitBaseDirWatcher?: chokidar.FSWatcher
  #gitMeta = new Map<string, GitInfo | null>()
  #currentBranch: string | null = null
  #currentUser?: string

  constructor (private config: GitDataSourceConfig) {
    this.#loadCurrentGitUser().catch(config.onError)
    this.#loadAndWatchCurrentBranch().catch(config.onError)
  }

  setSpecs (specs: string[]) {
    if (this.#destroyed) {
      return
    }

    // If we don't have a branch, it's likely b/c they
    if (this.#gitError) {
      this.#loadAndWatchCurrentBranch().catch(this.config.onError)
    }

    this.#loadBulkGitInfo(specs).catch(this.config.onError)
  }

  get gitBaseDir () {
    return this.#gitBaseDir
  }

  get currentBranch () {
    return this.#currentBranch
  }

  get currentUser () {
    return this.#currentUser ?? null
  }

  destroy () {
    this.#destroyWatcher(this.#gitBaseDirWatcher)
  }

  #destroyWatcher (watcher?: chokidar.FSWatcher) {
    // Can't do anything actionable with these errors
    watcher?.close().catch((e) => {})
  }

  async #loadAndWatchCurrentBranch () {
    if (this.#destroyed) {
      return
    }

    try {
      const [gitBaseDir] = await Promise.all([
        this.#git.revparse(GIT_ROOT_DIR_COMMAND),
        this.#loadCurrentBranch(),
      ])

      this.#gitBaseDir = gitBaseDir

      if (this.#destroyed) {
        return
      }

      this.#gitBaseDirWatcher = chokidar.watch(path.join(gitBaseDir, '.git', 'HEAD'), {
        ignoreInitial: true,
        ignorePermissionErrors: true,
      })

      // Fires when we switch branches
      this.#gitBaseDirWatcher.on('change', () => {
        this.#loadCurrentBranch().then(() => {
          this.config.onBranchChange(this.#currentBranch)
        })
      })
    } catch (e) {
      this.#gitError = true
      debug(`Error loading & watching current branch %s`, e.message)
    }
  }

  async #loadCurrentBranch () {
    this.#currentBranch = (await this.#git.branch()).current
    this.config.onBranchChange(this.#currentBranch)
  }

  async #loadCurrentGitUser () {
    try {
      return (await this.#git.getConfig('user.name')).value
    } catch (e) {
      debug(`Failed to get current git user`, e.message)

      return ''
    }
  }

  gitInfoFor (path: string): GitInfo | null {
    return this.#gitMeta.get(path) ?? null
  }

  async #loadBulkGitInfo (absolutePaths: readonly string[]) {
    if (absolutePaths.length === 0) {
      return
    }

    try {
      const [stdout, statusResult] = await Promise.all([
        os.platform() === 'win32'
          ? this.#getInfoWindows(absolutePaths)
          : this.#getInfoPosix(absolutePaths),
        this.#git.status(),
      ])

      debug('stdout %s', stdout)

      const changed: string[] = []

      for (const [i, file] of absolutePaths.entries()) {
        const current = this.#gitMeta.get(file)

        // first check unstaged/untracked files
        const isUnstaged = statusResult.files.find((x) => file.endsWith(x.path))

        let toSet: GitInfo | null = null

        // These are the status codes used by SimpleGit.
        // M -> modified
        // ? -> unstaged
        // A or ' ' -> staged, but not yet committed
        // D -> deleted, but we do not show deleted files in the UI, so it's not used.
        if (isUnstaged && ['M', 'A', ' ', '?'].includes(isUnstaged?.working_dir)) {
          const stat = fs.statSync(file)
          const ctime = dayjs(stat.ctime)

          toSet = {
            lastModifiedTimestamp: ctime.format('YYYY-MM-DD HH:mm:ss Z'),
            lastModifiedHumanReadable: ctime.fromNow(),
            author: this.#currentUser ?? '',
            statusType: isUnstaged.working_dir === 'M' ? 'modified' : 'created',
          }
        } else {
          const data = stdout[i]
          const info = data?.match(GIT_LOG_REGEXP)

          if (file && info && info[1] && info[2] && info[3]) {
            toSet = {
              lastModifiedTimestamp: info[1],
              lastModifiedHumanReadable: info[2],
              author: info[3],
              statusType: 'unmodified',
            }
          } else {
            debug(`did not get expected git log for ${file}, expected string with format '<timestamp> <time_ago> <author>'. Got: ${data}`)
            toSet = null
          }
        }

        this.#gitMeta.set(file, toSet)
        if (!_.isEqual(toSet, current)) {
          changed.push(file)
        }
      }

      if (!this.#destroyed) {
        this.config.onGitInfoChange(changed)
      }
    } catch (e) {
      // does not have git installed,
      // file is not under source control
      // ... etc ...
      debug('Error getting git info: %s', e)
    }
  }

  async #getInfoPosix (absolutePaths: readonly string[]) {
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

  async #getInfoWindows (absolutePaths: readonly string[]) {
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
}
