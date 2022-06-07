import gracefulFs from 'graceful-fs'
import type fs from 'fs'

export function patchFs (_fs: typeof fs) {
  // Add gracefulFs for EMFILE queuing.
  gracefulFs.gracefulify(_fs)
}
