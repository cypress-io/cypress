import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import debug from 'debug'

const logInfo = debug('cypress:snapgen:info')
const logError = debug('cypress:snapgen:error')

async function consolidateDep ({ projectBaseDir, dep }: { projectBaseDir: string, dep: string }): Promise<void> {
  logInfo('Looking for %s duplicates ...', dep)

  const matches = glob.sync(
    `{packages,node_modules/@cypress,node_modules/@packages}/**/node_modules/${dep}`,
    {
      cwd: projectBaseDir,
    },
  ).map((x) => path.join(projectBaseDir, x))

  logInfo(
    'Found %d %s duplicates%s',
    matches.length,
    dep,
    matches.length > 0 ? ', removing them' : '',
  )

  try {
    await Promise.all(matches.map(async (dir) => {
      await fs.remove(dir)
    }))

    logInfo('Done removing %s duplicates', dep)
  } catch (err) {
    logError(err)
    throw err
  }
}

/**
 * Remove all bluebird and lodash as they are essentially duplicated and all on the same major version
 *
 * @param {Partial<import('../snapconfig').SnapshotConfig>} opts
 */
export async function consolidateDeps ({ projectBaseDir }: { projectBaseDir: string }): Promise<void> {
  await consolidateDep({ projectBaseDir, dep: 'bluebird' })
  await consolidateDep({ projectBaseDir, dep: 'lodash' })
}
