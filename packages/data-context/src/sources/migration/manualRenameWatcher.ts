import chokidar from 'chokidar'
import globby from 'globby'
import { toPosix } from '../../util'

import Debug from 'debug'

const debug = Debug('cypress:data-context:sources:migration:manualRenameWatcher')

interface FileToBeMigratedManually {
  relative: string
  moved: boolean
}

export interface ComponentTestingMigrationStatus {
  files: Map<string, FileToBeMigratedManually>
  completed: boolean
}

export async function initComponentTestingMigration (
  projectRoot: string,
  componentFolder: string,
  testFiles: string[],
  onFileMoved: (status: ComponentTestingMigrationStatus) => void,
): Promise<{
  status: ComponentTestingMigrationStatus
  watcher: chokidar.FSWatcher | null
}> {
  debug('initComponentTestingMigration %O', { projectRoot, componentFolder, testFiles })
  const watchPaths = testFiles.map((glob) => {
    return `${componentFolder}/${glob}`
  })

  const watcher = chokidar.watch(
    watchPaths, {
      cwd: projectRoot,
    },
  )

  debug('watchPaths %o', watchPaths)

  let filesToBeMoved: Map<string, FileToBeMigratedManually> = (await globby(watchPaths, {
    cwd: projectRoot,
  })).reduce<Map<string, FileToBeMigratedManually>>((acc, relative) => {
    acc.set(relative, { relative, moved: false })

    return acc
  }, new Map())

  debug('files to be moved manually %o', filesToBeMoved)
  if (filesToBeMoved.size === 0) {
    // this should not happen as the step should be hidden in this case
    // but files can have been moved manually before clicking next
    return {
      status: {
        files: filesToBeMoved,
        completed: true,
      },
      watcher: null,
    }
  }

  watcher.on('unlink', (unlinkedPath) => {
    const posixUnlinkedPath = toPosix(unlinkedPath)
    const file = filesToBeMoved.get(posixUnlinkedPath)

    if (!file) {
      throw Error(`Watcher incorrectly triggered ${posixUnlinkedPath}
      while watching ${Array.from(filesToBeMoved.keys()).join(', ')}
      projectRoot: ${projectRoot}`)
    }

    file.moved = true

    const completed = Array.from(filesToBeMoved.values()).every((value) => value.moved === true)

    onFileMoved({
      files: filesToBeMoved,
      completed,
    })
  })

  return new Promise((resolve, reject) => {
    watcher.on('ready', () => {
      debug('watcher ready')
      resolve({
        status: {
          files: filesToBeMoved,
          completed: false,
        },
        watcher,
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}
