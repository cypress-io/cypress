import DataLoader from 'dataloader'
import { getGitInfo } from '../../util/git'
import { GitInfo } from '@packages/graphql'

const batchGitInfo = async (paths: readonly string[]): Promise<GitInfo[]> => {
  const info = await getGitInfo(paths)
  return paths.map((path) => {
    const i = info.get(path)
    if (!i) {
      throw Error(`Could not get info for ${path}`)
    }
    return new GitInfo(i)
  })
}

export const gitInfoLoader = new DataLoader<string, GitInfo>(batchGitInfo)