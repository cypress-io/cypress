import Debug from 'debug'
import { app, BrowserWindow } from 'electron'
import fse from 'fs-extra'
import path from 'path'
import { PNG } from 'pngjs'

const isCi = require('ci-info').isCI

if (app) {
  app.on('window-all-closed', () => {
  })
}

export const HEIGHT = 600

export const WIDTH = 1200

const EXT = '.png'
const debug = Debug(isCi ? '*' : 'visualSnapshotErrors')

export const copyImageToBase = (from: string, to: string) => {
  return fse.copy(from, to, { overwrite: true })
}

export const convertHtmlToImage = async (htmlFile: string, snapshotImagesFolder: string) => {
  const win = new BrowserWindow({
    show: false,
    width: WIDTH,
    height: HEIGHT,
  })

  try {
    await app.isReady()

    win.webContents.debugger.attach()

    debug(`Loading %s`, htmlFile)

    await win.loadFile(htmlFile)

    await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride', {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    })

    const { data } = await win.webContents.debugger.sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
    })

    const imagePath = htmlFile.replace('.html', EXT)
    const snapshotImagePath = path.join(snapshotImagesFolder, path.basename(imagePath))

    debug('snapshotImagePath %s', snapshotImagePath)

    const receivedImageBuffer = Buffer.from(data, 'base64')
    const receivedPng = PNG.sync.read(receivedImageBuffer)
    const receivedPngBuffer = PNG.sync.write(receivedPng)

    await fse.outputFile(snapshotImagePath, receivedPngBuffer)

    // - if image does not exist in __snapshot-bases__
    //   then copy into __snapshot-bases__
    // - if image does exist then diff if, and if its
    //   greater than >.01 diff, then copy it in
    // - unless we're in CI, then fail if there's a diff
    //   try {
    //     const buf = await fse.readFile(snapshotImagePath)
    //     const existingPng = PNG.sync.read(buf)
    //     const diffPng = new PNG({ width: WIDTH, height: HEIGHT })
    //     const changed = pixelmatch(existingPng.data, receivedPng.data, diffPng.data, WIDTH, HEIGHT, { threshold: 0.3 })

    //     debug('num pixels different: %s', changed)

    //     if (changed > 100) {
    //       if (isCi) {
    //         throw new Error(`Image difference detected. Base error image no longer matches for file: ${snapshotImagePath}, off by ${changed} pixels`)
    //       }

  //       await copyImageToBase(imagePath, snapshotImagePath)
  //     }
  //   } catch (e: any) {
  //     if (e.code === 'ENOENT') {
  //       debug(`Adding new image: ${imagePath}`)
  //       await copyImageToBase(imagePath, snapshotImagePath)
  //     } else {
  //       throw e
  //     }
  //   }
  } finally {
    win.destroy()
  }
}
