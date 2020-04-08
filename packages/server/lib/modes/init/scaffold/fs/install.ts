import fs from '../../../../util/fs'
import spawn from './spawn'
import { join } from 'path'
import { InitConfig } from '../../types'

export const installPackages = async (projRoot: string, config: InitConfig) => {
  const packages: string[] = []

  if (config.typescript) {
    packages.push('typescript')
  }

  if (config.eslint) {
    packages.push('eslint', 'eslint-plugin-cypress')
  }

  if (config.chaiFriendly) {
    packages.push('eslint-plugin-chai-friendly')
  }

  if (packages.length === 0) {
    //eslint-disable-next-line no-console
    console.log('Nothing to install.')

    return
  }

  if (!isYarn(projRoot)) {
    await spawn('yarn', ['add', '--dev', ...packages], { stdio: 'inherit' })
  } else {
    await spawn('npm', ['i', '-D', ...packages], { stdio: 'inherit' })
  }
}

const isYarn = async (projRoot: string) => {
  return await fs.access(join(projRoot, 'yarn.lock'))
}
