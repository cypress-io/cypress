import path from 'path'
import fs from 'fs-extra'

const INITIAL_TEMPLATE_PATH = path.resolve(__dirname, '..', 'initial-template')

export async function getInitialSupportFilesPaths () {
  return (
    await fs.readdir(path.join(INITIAL_TEMPLATE_PATH, 'support'))
  ).map((filename) => path.join(INITIAL_TEMPLATE_PATH, 'support', filename))
}

export function getInitialPluginsFilePath () {
  return path.join(INITIAL_TEMPLATE_PATH, 'plugins', 'index.js')
}

export function getInitialTsConfigPath () {
  return path.join(INITIAL_TEMPLATE_PATH, 'tsconfig.json')
}
