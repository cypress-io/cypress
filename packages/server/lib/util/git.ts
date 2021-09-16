import execa from 'execa'

export interface GitInfo {
  author: string | null
  lastModifiedTimestamp: string | null
  lastModifiedHumanReadable: string | null
}

// matches <timestamp> <when> <author>
// output of git log -1 --pretty=format:%ci %ar %an <file>
// eg '2021-09-14 13:43:19 +1000 2 days ago Lachlan Miller

const regexp = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+].+?)\s(.+ago)\s(.*)/

export const getGitInfo = (absolutePath: string): GitInfo | null => {
  try {
    const gitinfo = execa.sync('git', [
      'log',
      '--pretty=format:%ci %ar %an',
      '-1',
      absolutePath,
    ])

    const result = gitinfo.stdout.match(regexp)

    if (result && result[1] && result[2] && result[3]) {
      return {
        lastModifiedTimestamp: result[1],
        lastModifiedHumanReadable: result[2],
        author: result[3],
      }
    }
  } catch (e) {
    // does not have git installed,
    // file is not under source control
    // ... etc ...
    // just return null
    return null
  }

  return null
}
