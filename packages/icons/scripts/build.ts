import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'
import os from 'os'

async function build () {
  const distPath = path.join(__dirname, '../dist')
  const assetsPath = path.join(__dirname, '../assets')
  const iconsPath = path.join(distPath, 'icons')

  const iconsetPath = path.join(distPath, 'cypress.iconset')

  await fs.remove(distPath)
  await fs.mkdir(iconsPath, { recursive: true })

  await exec('yarn tsc -p ./tsconfig.build.json')

  if (os.platform() === 'darwin') {
    await exec('iconutil -c icns assets/cypress.iconset -o dist/icons/cypress.icns')
  }

  await fs.copy(assetsPath, distPath)
  await fs.copy(iconsetPath, iconsPath, { overwrite: true })
  await fs.remove(iconsetPath)
}

// tslint:disable:no-floating-promises
build()
