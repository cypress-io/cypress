import execa from 'execa'
import simpleGit, { StatusResult, DefaultLogFields } from 'simple-git'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import path from 'path'
import fs from 'fs'
import Debug from 'debug'
import type { gitStatusType } from '@packages/types'
import chokidar from 'chokidar'
import { isEqual } from 'lodash'

const debug = Debug('cypress:data-context:sources:GitDataSource')
const debugVerbose = Debug('cypress-verbose:data-context:sources:GitDataSource')

dayjs.extend(relativeTime)

// We get the last modified time for each spec by running `git log` once per
// spec. The reason is none of the Node.js git wrappers support bulk fetching
// the last modified date and user. The calls run with bounded concurrency,
// since awaiting them one at a time is too slow for a large spec list.
// Where possible, we use SimpleGit to get other git info, like
// the status of untracked files and the current git username.

// matches <timestamp> <when> <author>
// $ git log -1 --pretty=format:%ci %ar %an <file>
// eg '2021-09-14 13:43:19 +1000 2 days ago Lachlan Miller
const GIT_LOG_REGEXP = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+].+?)\s(.+ago)\s([^|]*)\|([^|]*)\|([^|]*)/
const GIT_LOG_ARGS = ['log', '--max-count=1', '--pretty=format:%ci %ar %an|%h|%s']
const GIT_LOG_CONCURRENCY = 16
const GIT_ROOT_DIR_COMMAND = '--show-toplevel'
const SIXTY_SECONDS = 60 * 1000

interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
  statusType: typeof gitStatusType[number]
  subject: string | null
  shortHash: string | null
}

interface GitDataSourceConfig {
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

  onGitLogChange?(shas: string[]): void
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
  #gitHashes?: string[]
  #currentCommitInfo?: DefaultLogFields
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

    // Start by assuming the git repository matches the project root
    // This will be overridden if needed by the `verifyGitRepo` function
    // Since that is async and we can't block the constructor we make this
    // guess to avoid double-initializing
    this.#gitBaseDir = this.config.projectRoot

    // don't watch/refresh git data in run mode since we only
    // need it to detect the .git directory to set `repoRoot`
    if (config.isRunMode) {
      this.#verifyGitRepo().catch(() => {
        // Empty catch for no-floating-promises rule
      })
    } else {
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
    debug('Refreshing git data')
    this.#verifyGitRepo().then(() => {
      const toAwait = [
        this.#loadAndWatchCurrentBranch(),
      ]

      if (this.#specs) {
        toAwait.push(this.#loadBulkGitInfo(this.#specs))
      }

      if (!this.#gitErrored) {
        toAwait.push(this.#loadGitHashes())
      }

      Promise.all(toAwait).then(() => {
        if (this.#destroyed) {
          return
        }

        this.#intervalTimer = setTimeout(() => {
          this.#refreshAllGitData()
        }, SIXTY_SECONDS)
      }).catch(this.config.onError)
    }).catch(this.config.onError)
  }

  setSpecs (specs: string[]) {
    if (this.#destroyed || this.config.isRunMode) {
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

  get currentHashes () {
    return this.#gitHashes
  }

  get currentCommitInfo () {
    return this.#currentCommitInfo
  }

  async destroy () {
    debug('Stopping timer and watcher')
    this.#destroyed = true
    if (this.#intervalTimer) {
      debug('Clearing timeout')
      clearTimeout(this.#intervalTimer)
    }

    debug('Destroying watcher')
    await this.#destroyWatcher(this.#gitBaseDirWatcher)

    debug('Destroy complete')
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
        await this.#loadCurrentBranch().then(() => {
          this.config.onBranchChange(this.#currentBranch)
        })
      }

      if (this.#destroyed || !this.#gitBaseDir) {
        return
      }

      if (!this.config.isRunMode && !this.#gitBaseDirWatcher) {
        debug('Creating watcher')
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
              this.#loadGitHashes().catch(() => {})
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

        debug('Watcher initialized')
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
          this.#getInfo(absolutePaths),
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
        if (!isEqual(toSet, current)) {
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

  async #getInfo (absolutePaths: readonly string[]) {
    debug('getting git info for %o:', absolutePaths)
    debug('cwd: `%s`', this.#gitBaseDir)

    const readOne = async (specPath: string) => {
      // `--` keeps git from reading a spec path as a revision
      const args = [...GIT_LOG_ARGS, '--', path.resolve(specPath)]

      try {
        const result = await execa('git', args, { cwd: this.#gitBaseDir })

        return result.stdout.trim()
      } catch (err) {
        debug('command execution error: %o', err)

        return ''
      }
    }

    const output: string[] = []

    for (let i = 0; i < absolutePaths.length; i += GIT_LOG_CONCURRENCY) {
      const batch = absolutePaths.slice(i, i + GIT_LOG_CONCURRENCY)

      output.push(...await Promise.all(batch.map((specPath) => readOne(specPath))))
    }

    return output
  }

  async #loadGitHashes () {
    debug('Loading git hashes')
    try {
      const logResponse = await this.#git?.log({ maxCount: 100, '--first-parent': undefined })

      debug('hashes loaded')
      const currentHashes = logResponse?.all.map((log) => log.hash)

      if (!isEqual(this.#gitHashes, currentHashes)) {
        this.#gitHashes = currentHashes || []
        this.#currentCommitInfo = logResponse?.all[0]

        debug(`Calling onGitLogChange: callback defined ${!!this.config.onGitLogChange}, git hash count ${currentHashes?.length}`)
        this.config.onGitLogChange?.(this.#gitHashes)
      }
    } catch (e) {
      debug('Error loading git hashes %s', e)
    }
  }

  __setGitHashesForTesting (hashes: string[]) {
    debug('Setting git hashes for testing', hashes)
    this.#gitHashes = hashes
  }
}
