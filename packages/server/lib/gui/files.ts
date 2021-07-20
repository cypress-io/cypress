import Debug from 'debug'
import openProject from '../open_project'
import { createFile } from '../util/spec_writer'
import { showSaveDialog } from './dialog'

const debug = Debug('cypress:server:gui:files')

export const showDialogAndCreateSpec = () => {
  return openProject.getConfig()
  .then((cfg) => {
    debug('got config')

    return showSaveDialog(cfg.integrationFolder).then((path) => {
      return {
        cfg,
        path,
      }
    })
  })
  .then((opt) => {
    const { path } = opt

    debug('got opt', opt)

    // only create file if they selected a file
    if (path) {
      return createFile(path)
    }

    return opt
  })
  .then(({ cfg, path }) => {
    debug('file potentially created', path)
    if (!path) {
      return {
        specs: null,
        path,
      }
    }

    // reload specs now that we've added a new file
    // we reload here so we can update ui immediately instead of
    // waiting for file watching to send updated spec list
    return openProject.getSpecs(cfg).then((specs) => {
      debug('found specs', specs)

      return {
        specs,
        path,
      }
    })
  })
}
