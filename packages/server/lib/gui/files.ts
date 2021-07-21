import Debug from 'debug'
import openProject from '../open_project'
import { createFile } from '../util/spec_writer'
import { showSaveDialog } from './dialog'

const debug = Debug('cypress:server:gui:files')

export const showDialogAndCreateSpec = async () => {
  const cfg = openProject.getConfig()

  const path = await showSaveDialog(cfg.integrationFolder)

  if (!path) {
    return {
      specs: null,
      path,
    }
  }

  // only create file if they selected a file
  if (path) {
    await createFile(path)
  }

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
  const specs = await openProject.getSpecs(cfg)

  return {
    specs,
    path,
  }
}
