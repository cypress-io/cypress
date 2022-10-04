import fs from 'fs-extra'
import path from 'path'

import { config } from './config'
const { isWindows } = config

export function processArgsFromFile (
  argsFilePath: string,
  userMksnapshotArgs: string[],
  workingDir: string,
  crossArchDirs: string[],
) {
  let mksnapshotArgs: string[]
  let mksnapshotBinaryDir = workingDir
  const binaryFile = isWindows ? 'mksnapshot.exe' : 'mksnapshot'

  if (fs.existsSync(argsFilePath)) {
    // Use args from args file if it is provided as these match what is used to
    // generate the original snapshot
    const mksnapshotArgsSrc = fs.readFileSync(argsFilePath, 'utf8')
    const newlineRegEx = /(\r\n|\r|\n)/g
    const mksnapshotArgsFromFile = mksnapshotArgsSrc
    .split(newlineRegEx)
    .filter((arg) => {
      return !arg.match(newlineRegEx) && arg !== ''
    })

    // TODO: Figure out why we need to filter this out: https://github.com/cypress-io/cypress/issues/24092
    const turboProfilingInputIndex = mksnapshotArgsFromFile.indexOf('--turbo-profiling-input')

    if (turboProfilingInputIndex > -1) {
      mksnapshotArgsFromFile.splice(turboProfilingInputIndex, 2)
    }

    const mksnapshotBinaryPath = path.parse(mksnapshotArgsFromFile[0])

    if (mksnapshotBinaryPath.dir) {
      mksnapshotBinaryDir = path.join(workingDir, mksnapshotBinaryPath.dir)
    }

    mksnapshotArgs = userMksnapshotArgs.concat(mksnapshotArgsFromFile.slice(1))
  } else {
    mksnapshotArgs = userMksnapshotArgs.concat([
      '--startup_blob',
      'snapshot_blob.bin',
    ])

    if (!mksnapshotArgs.includes('--turbo_instruction_scheduling')) {
      mksnapshotArgs.push('--turbo_instruction_scheduling')
    }

    const tmpBinaryPath = path.join(mksnapshotBinaryDir, binaryFile)

    if (!fs.existsSync(tmpBinaryPath)) {
      const matchingDir = crossArchDirs.find((crossArchDir) => {
        const candidateDir = path.join(mksnapshotBinaryDir, crossArchDir)
        const candidateBinaryPath = path.join(candidateDir, binaryFile)

        if (fs.existsSync(candidateBinaryPath)) {
          return true
        }

        return false
      })

      if (matchingDir != null) {
        mksnapshotBinaryDir = path.join(workingDir, matchingDir)
      } else {
        // eslint-disable-next-line no-console
        console.error('ERROR: Could not find mksnapshot')
        // TODO(thlorenz): shouldn't exit here technically, but I've had it cleaning up the original
        // mess.
        process.exit(1)
      }
    }
  }

  return {
    mksnapshotBinaryDir,
    mksnapshotCommand: path.join(mksnapshotBinaryDir, binaryFile),
    mksnapshotArgs,
  }
}
