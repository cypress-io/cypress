import { execSync } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { gt, inc, major } from 'semver'
import type { ReleaseType } from 'semver'
import bumpCb from 'conventional-recommended-bump'
import minimist from 'minimist'
import rootPackageJson from '../package.json' with { type: 'json' }
import { changeCatagories } from './semantic-commits/change-categories.js'
import { getCurrentReleaseData } from './semantic-commits/get-current-release-data.js'

interface Commit {
  type?: string | null
}

// semantic version bump: 0 - major, 1 - minor, 2 - patch
type BumpLevel = 0 | 1 | 2

interface BumpOptions {
  path: string
  whatBump: (commits: Commit[]) => { level: BumpLevel, reason: string }
}

interface NextVersion {
  nextVersion: string
  commits: Commit[]
}

const checkedInBinaryVersion: string = rootPackageJson.version
const SENTINEL_VERSION = '0.0.0-development'
const isSentinelVersion = checkedInBinaryVersion === SENTINEL_VERSION

const bump: (options: BumpOptions) => Promise<{ releaseType?: ReleaseType }> = promisify(bumpCb)
const paths = ['packages', 'cli']

export const getNextVersionForPath = async (path: string): Promise<NextVersion> => {
  const { version: releasedVersion, isPreviousMajor } = await getCurrentReleaseData(false)

  let commits: Commit[] = []
  const whatBump = (foundCommits: Commit[]) => {
    let level: BumpLevel = 2
    let breakings = 0
    let features = 0

    commits = foundCommits
    foundCommits.forEach((commit) => {
      if (!commit.type || !changeCatagories[commit.type]) return

      if (changeCatagories[commit.type].release === 'major') {
        breakings += 1
        level = 0
      } else if (changeCatagories[commit.type].release === 'minor') {
        features += 1
        if (level === 2) {
          level = 1
        }
      }
    })

    return {
      level,
      reason: breakings > 0
        ? `There is ${breakings} BREAKING CHANGE and ${features} features`
        : features > 0 ? `There ${features} features` : 'There are only patch changes in this release',
    }
  }

  const { releaseType } = await bump({
    whatBump,
    path,
  })

  let nextVersion = inc(releasedVersion, releaseType || 'patch')

  // See ../guides/next-version.md for documentation.
  // for the time being, honoring this ENV -- ideally this will be deleted to remove manually overriding without a PR
  if (process.env.NEXT_VERSION) {
    nextVersion = process.env.NEXT_VERSION
  } else if (!isSentinelVersion && checkedInBinaryVersion !== releasedVersion) {
    // honor a manually-set real version in package.json
    nextVersion = checkedInBinaryVersion
  }

  if (!nextVersion) {
    throw new Error(`Unable to increment the released version ${releasedVersion}.`)
  }

  if (isPreviousMajor && major(nextVersion) > major(releasedVersion)) {
    throw new Error(`The next version ${nextVersion} is outside the ${major(releasedVersion)}.x line this branch releases.`)
  }

  return {
    nextVersion,
    commits,
  }
}

export const getNextVersionForBinary = async (): Promise<NextVersion> => {
  let commits: Commit[] = []
  let nextVersion: string | undefined

  for (const path of paths) {
    const { nextVersion: pathNextVersion, commits: pathCommits } = await getNextVersionForPath(path)

    if (!nextVersion || gt(pathNextVersion, nextVersion)) {
      nextVersion = pathNextVersion
    }

    commits = commits.concat(pathCommits)
  }

  if (!nextVersion) {
    throw new Error('Unable to determine next version.')
  }

  return {
    nextVersion,
    commits,
  }
}

const main = async () => {
  process.chdir(path.join(import.meta.dirname, '..'))

  const args = minimist(process.argv.slice(2))

  const nextVersion = args.nextVersion || (await getNextVersionForBinary()).nextVersion

  if (args.npm && checkedInBinaryVersion !== nextVersion) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)
    execSync(cmd)

    return
  }

  console.log(nextVersion)
}

// Not awaited: top-level await would make `require()` of this module throw
// ERR_REQUIRE_ASYNC_MODULE in CommonJS callers such as get-binary-release-data.js.
if (process.argv[1] === import.meta.filename) {
  void main()
}
