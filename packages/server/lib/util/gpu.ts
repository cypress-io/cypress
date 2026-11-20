import { isRunningAsElectronProcess } from './electron-app'

// SwiftShader keeps WebGL available once the GPU is off
export const SOFTWARE_RENDERING_SWITCHES = ['disable-gpu', 'enable-unsafe-swiftshader'] as const

let softwareRendering = false

// Each GPU process holds hundreds of MB, which adds up when several runs share a machine
export const useSoftwareRendering = () => {
  softwareRendering = true

  if (process.versions.electron && isRunningAsElectronProcess()) {
    const { app } = require('electron')

    for (const name of SOFTWARE_RENDERING_SWITCHES) {
      app.commandLine.appendSwitch(name)
    }
  }
}

export const isSoftwareRendering = () => softwareRendering
