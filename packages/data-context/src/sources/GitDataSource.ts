import execa from 'execa'
import simpleGit, { StatusResult } from 'simple-git'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import path from 'path'
import fs from 'fs'
import os from 'os'
import Debug from 'debug'
import type { gitStatusType } from '@packages/types'
import chokidar from 'chokidar'
import _ from 'lodash'

const debug = Debug('cypress:data-context:sources:GitDataSource')
const debugVerbose = Debug('cypress-verbose:data-context:sources:GitDataSource')

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
const GIT_LOG_REGEXP = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+].+?)\s(.+ago)\s([^|]*)\|([^|]*)\|([^|]*)/
const GIT_LOG_COMMAND = `git log --max-count=1 --pretty="format:%ci %ar %an|%h|%s"`
const GIT_ROOT_DIR_COMMAND = '--show-toplevel'
const SIXTY_SECONDS = 60 * 1000

function ensurePosixPathSeparators (text: string) {
  return text.replace(/\\/g, '/') // normalize \ to /
}
export interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
  statusType: typeof gitStatusType[number]
  subject: string | null
  shortHash: string | null
}

export interface GitDataSourceConfig {
  /**
   * In run mode, we currently don't need the git info, so we explicitly
   * check and skip if we know we don't
   */
  isRunMode: boolean
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
  #specs?: string[]
  #git?: ReturnType<typeof simpleGit>
  #gitErrored = false
  #destroyed = false
  #gitBaseDir?: string
  #gitBaseDirWatcher?: chokidar.FSWatcher
  #gitMeta = new Map<string, GitInfo | null>()
  #currentBranch: string | null = null
  #intervalTimer?: NodeJS.Timeout

  constructor (private config: GitDataSourceConfig) {
    // Simple Git will error if the projectRoot does not exist.
    // This should never happen outside of testing code simulating
    // incorrect scenarios
    debug('config: %o', this.config)
    try {
      this.#git = simpleGit({ baseDir: this.config.projectRoot })
    } catch {
      // suppress exception if git cannot be found
      debug('exception caught when loading git client')
    }

    if (!config.isRunMode) {
      this.#refreshAllGitData()
    }
  }

  async #verifyGitRepo () {
    if (!this.#git) {
      this.#gitErrored = true

      return
    }

    try {
      this.#gitBaseDir = await this.#git.revparse(GIT_ROOT_DIR_COMMAND)
      this.#gitErrored = false
    } catch {
      this.#gitErrored = true
    }
  }

  #refreshAllGitData () {
    this.#verifyGitRepo().then(() => {
      const toAwait = [
        this.#loadAndWatchCurrentBranch(),
      ]

      if (this.#specs) {
        toAwait.push(this.#loadBulkGitInfo(this.#specs))
      }

      Promise.all(toAwait).then(() => {
        this.#intervalTimer = setTimeout(() => {
          debug('Refreshing git data')
          this.#refreshAllGitData()
        }, SIXTY_SECONDS)
      }).catch(this.config.onError)
    }).catch(this.config.onError)
  }

  setSpecs (specs: string[]) {
    if (this.#destroyed) {
      return
    }

    // If we don't have a branch, it's likely b/c they don't have git setup.
    // Let's re-check and see if they have initialized a git repo by now
    if (this.#gitErrored) {
      this.#loadAndWatchCurrentBranch().catch(this.config.onError)
    }

    this.#loadBulkGitInfo(specs).catch(this.config.onError)

    this.#specs = specs
  }

  get gitBaseDir () {
    return this.#gitBaseDir
  }

  get currentBranch () {
    return this.#currentBranch
  }

  async destroy () {
    this.#destroyed = true
    if (this.#intervalTimer) {
      clearTimeout(this.#intervalTimer)
    }

    await this.#destroyWatcher(this.#gitBaseDirWatcher)
  }

  async #destroyWatcher (watcher?: chokidar.FSWatcher) {
    // Can't do anything actionable with these errors
    await watcher?.close().catch((e) => {})
  }

  async #loadAndWatchCurrentBranch () {
    if (this.#destroyed) {
      return
    }

    try {
      if (this.#gitErrored) {
        debug('Skipping branch watching because a git error was reported')
      }

      if (this.#git) {
        await this.#loadCurrentBranch()
      }

      if (this.#destroyed || !this.#gitBaseDir) {
        return
      }

      if (!this.config.isRunMode) {
        this.#gitBaseDirWatcher = chokidar.watch(path.join(this.#gitBaseDir, '.git', 'HEAD'), {
          ignoreInitial: true,
          ignorePermissionErrors: true,
        })

        // Fires when we switch branches
        this.#gitBaseDirWatcher.on('change', () => {
          const prevBranch = this.#currentBranch

          this.#loadCurrentBranch().then(() => {
            if (prevBranch !== this.#currentBranch) {
              this.config.onBranchChange(this.#currentBranch)
            }
          }).catch((e) => {
            debug('Errored loading branch info on git change %s', e.message)
            this.#currentBranch = null
            this.#gitErrored = true
          })
        })

        this.#gitBaseDirWatcher.on('error', (e) => {
          debug(`Failed to watch for git changes`, e.message)
          this.config.onError(e)
        })
      }
    } catch (e) {
      this.#gitErrored = true
      debug(`Error loading & watching current branch %s`, e.message)
    }
  }

  async #loadCurrentBranch () {
    if (this.#git) {
      try {
        this.#currentBranch = (await this.#git.branch()).current
        debug(`On current branch %s`, this.#currentBranch)
        this.config.onBranchChange(this.#currentBranch)
      } catch {
        debug('this is not a git repo')
      }
    }
  }

  gitInfoFor (path: string): GitInfo | null {
    return this.#gitMeta.get(path) ?? null
  }

  async #loadBulkGitInfo (absolutePaths: readonly string[]) {
    debugVerbose(`checking %d files`, absolutePaths.length)
    if (absolutePaths.length === 0) {
      return
    }

    try {
      const changed: string[] = []

      let statusResult: StatusResult | undefined = undefined
      let gitLogOutput: string[] = []

      if (!this.#gitErrored) {
        const [stdout, statusResultReturned] = await Promise.all([
          os.platform() === 'win32'
            ? this.#getInfoWindows(absolutePaths)
            : this.#getInfoPosix(absolutePaths),
          this.#git?.status(),
        ])

        gitLogOutput = stdout
        statusResult = statusResultReturned

        debugVerbose('stdout %s', stdout.toString())
      }

      // Go through each file, updating our gitInfo cache and detecting which
      // entries have changed, to notify the UI
      for (const [i, file] of absolutePaths.entries()) {
        debugVerbose(`checking %s`, file)
        const current = this.#gitMeta.get(file)

        // first check unstaged/untracked files
        const isUnstaged = statusResult?.files.find((x) => file.endsWith(x.path))

        let toSet: GitInfo | null = null

        const stat = await fs.promises.stat(file)
        const ctime = dayjs(stat.ctime)
        const birthtime = dayjs(stat.birthtime)

        // These are the status codes used by SimpleGit.
        // M -> modified
        // ? -> unstaged
        // A or ' ' -> staged, but not yet committed
        // D -> deleted, but we do not show deleted files in the UI, so it's not used.
        if (!this.#gitErrored && isUnstaged && ['M', 'A', ' ', '?'].includes(isUnstaged?.working_dir)) {
          toSet = {
            lastModifiedTimestamp: isUnstaged.working_dir === 'M' ? ctime.format('YYYY-MM-DD HH:mm:ss Z') : birthtime.format('YYYY-MM-DD HH:mm:ss Z'),
            lastModifiedHumanReadable: isUnstaged.working_dir === 'M' ? ctime.fromNow() : birthtime.fromNow(),
            author: '', // unstaged file don't have an author
            statusType: isUnstaged.working_dir === 'M' ? 'modified' : 'created',
            subject: null,
            shortHash: null,
          }
        } else if (this.#gitErrored) {
          toSet = {
            lastModifiedTimestamp: ctime.format('YYYY-MM-DD HH:mm:ss Z'),
            lastModifiedHumanReadable: ctime.fromNow(),
            author: '', // unstaged file don't have an author
            statusType: 'noGitInfo',
            subject: null,
            shortHash: null,
          }
        } else {
          const data = gitLogOutput[i]
          const info = data?.match(GIT_LOG_REGEXP)

          if (file && info && info[1] && info[2] && info[3] && info[4] && info[5]) {
            toSet = {
              lastModifiedTimestamp: info[1],
              lastModifiedHumanReadable: info[2],
              author: info[3],
              statusType: 'unmodified',
              subject: info[5],
              shortHash: info[4],
            }
          } else {
            debug(`did not get expected git log for ${file}, expected string with format '<timestamp> <time_ago> <author>|<short_hash>|<subject>'. Got: ${data}`)
            toSet = null
          }
        }

        this.#gitMeta.set(file, toSet)
        if (!_.isEqual(toSet, current)) {
          changed.push(file)
        }
      }

      if (!this.#destroyed) {
        debugVerbose(`updated %o`, changed)
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
    // Escape any quotes within the filepath, then surround with quotes
    const paths = absolutePaths
    .map((p) => `"${path.resolve(p).replace(/\"/g, '\\"')}"`).join(' ')

    // for file in {one,two} is valid in bash, but for file {one} is not
    // no need to use a for loop for a single file
    // IFS is needed to handle paths with white space.
    const cmd = paths.length === 1
      ? `${GIT_LOG_COMMAND} ${paths[0]}`
      : `IFS=$'\n'; for file in ${paths}; do echo $(${GIT_LOG_COMMAND} $file); done`

    debug('executing command: `%s`', cmd)
    debug('cwd: `%s`', this.#gitBaseDir)

    const result = await execa(cmd, { shell: true, cwd: this.#gitBaseDir })
    const stdout = result.stdout.split('\n')

    if (result.exitCode !== 0) {
      debug(`command execution error: %o`, result)
    }

    if (stdout.length !== absolutePaths.length) {
      debug('unexpected command execution result: %o', result)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    return stdout
  }

  async #getInfoWindows (absolutePaths: readonly string[]) {
    debug('getting git info for %o:', absolutePaths)
    const paths = absolutePaths.map((x) => `"${path.resolve(x)}"`).join(',')
    const cmd = `FOR %x in (${paths}) DO (${GIT_LOG_COMMAND} %x)`

    debug('executing command: `%s`', cmd)
    debug('cwd: `%s`', this.config.projectRoot)

    const subprocess = execa(cmd, { shell: true, cwd: this.config.projectRoot })
    let result

    try {
      result = await subprocess
    } catch (err) {
      result = err
    }

    const stdout = ensurePosixPathSeparators(result.stdout).split('\r\n') // windows uses CRLF for carriage returns

    const output: string[] = []

    for (const p of absolutePaths) {
      const idx = stdout.findIndex((entry) => entry.includes(p))
      const text = stdout[idx + 1] ?? ''

      output.push(text)
    }

    if (output.length !== absolutePaths.length) {
      debug('stdout', output)
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${output.length}`)
    }

    return output
  }
}
