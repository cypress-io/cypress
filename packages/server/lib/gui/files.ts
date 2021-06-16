import openProject from '../open_project'
import { createFile } from '../util/spec_writer'
import { showSaveDialog } from './dialog'

export const showDialogAndCreateSpec = () => {
  return openProject.getConfig()
  .then((cfg) => {
    return showSaveDialog(cfg.integrationFolder).then((path) => {
      return {
        cfg,
        path,
      }
    })
  })
  .tap(({ path }) => {
    // only create file if they selected a file
    if (path) {
      return createFile(path)
    }

    return
  })
  .then(({ cfg, path }) => {
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
      return {
        specs,
        path,
      }
    })
  })
}
