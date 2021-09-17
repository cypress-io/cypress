import execa from 'execa'
import path from 'path'
import os from 'os'
import Debug from 'debug'

const debug = Debug('cypress:server:git')

export interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
}

// matches <timestamp> <when> <author>
// $ git log -1 --pretty=format:%ci %ar %an <file>
// eg '2021-09-14 13:43:19 +1000 2 days ago Lachlan Miller
const regexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+].+?)\s(.+ago)\s(.*)/

export const getGitInfo = (absolutePaths: string[]): Map<string, GitInfo> => {
  try {
    const paths = absolutePaths.map((x) => path.resolve(x)).join(',')
    const cmd = os.platform() === 'win32'
      ? `FOR %x in (${paths}) DO (git log -1 --pretty='format:%ci %ar %an' %x)`
      : `for name in {${paths}}; do echo $(git log -1 --pretty='format:%ci %ar %an' $name); done`

    const result = execa.sync(cmd, { shell: true })
    const stdout = result.stdout.split('\n')

    if (stdout.length !== absolutePaths.length) {
      throw Error(`Expect result array to have same length as input. Input: ${absolutePaths.length} Output: ${stdout.length}`)
    }

    debug('stdout for git info', stdout)

    const output: Map<string, GitInfo> = new Map()

    for (let i = 0; i < absolutePaths.length; i++) {
      const file = absolutePaths[i]
      const info = stdout[i].match(regexp)

      if (info && info[1] && info[2] && info[3]) {
        output.set(file, {
          lastModifiedTimestamp: info[1],
          lastModifiedHumanReadable: info[2],
          author: info[3],
        })
      }
    }

    return output
  } catch (e) {
    debug('Error getting git info: %s', e.message)

    // does not have git installed,
    // file is not under source control
    // ... etc ...
    // just return an empty map
    return new Map()
  }
}
