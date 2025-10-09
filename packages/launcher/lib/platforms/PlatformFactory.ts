import os from 'os'
import type { Platform } from './Platform'
import { Darwin } from './XDarwin'
import { Linux } from './Linux'
import { Windows } from './Windows'

export class PlatformFactory {
  static select (): Platform {
    switch (os.platform()) {
      case 'darwin':
        return new Darwin()
      case 'linux':
        return new Linux()
      case 'win32':
        return new Windows()
      default:
        throw new Error(`Unsupported platform: ${os.platform()} ${os.arch()}`)
    }
  }
}
