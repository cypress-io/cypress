import fs from 'fs-extra'
import { StdioOptions, spawnSync } from 'child_process'
import { config } from './config'
import path from 'path'
import tempDir from 'temp-dir'
import { processArgsFromFile } from './process-args-from-file'
import debug from 'debug'

const logInfo = debug('cypress:mksnapshot:info')
const logDebug = debug('cypress:mksnapshot:debug')
const logError = debug('cypress:mksnapshot:error')

const workingDir = path.join(tempDir, 'mksnapshot-workdir')

fs.ensureDirSync(workingDir)
const { crossArchDirs, binDir, isWindows, snapshotBlobFile, v8ContextFile } =
  config

// TODO(thlorenz): this manual args parsing was copied from the original module and could be
// improved to use a proper args parser instead
function checkArgs (args: string[]) {
  if (args.length === 0 || args.includes('--help')) {
    logError(
      'Usage: mksnapshot file.js (--output_dir OUTPUT_DIR).  ' +
        'Additional mksnapshot args except for --startup_blob are supported:',
    )

    args.push('--help')
    process.exit(0)
  }

  // -----------------
  // --startup_blob not supported
  // -----------------
  if (args.includes('--startup_blob')) {
    logError(
      '--startup_blob argument not supported. Use --output_dir to specify where to output snapshot_blob.bin',
    )

    process.exit(1)
  }

  return args
}

// -----------------
// Output Dir
// -----------------
function extractOutdir (args: string[]) {
  let mksnapshotArgs = args
  const outDirIdx = args.indexOf('--output_dir')
  let outputDir = process.cwd()

  if (outDirIdx > -1) {
    mksnapshotArgs = args.slice(0, outDirIdx)
    if (args.length >= outDirIdx + 2) {
      outputDir = args[outDirIdx + 1]
      if (args.length > outDirIdx + 2) {
        mksnapshotArgs = mksnapshotArgs.concat(args.slice(outDirIdx + 2))
      }
    } else {
      logError(
        'Error! Output directory argument given but directory not specified.',
      )

      throw new Error('Need to specify the `--output_dir` argument')
    }
  }

  return { outputDir, mksnapshotArgs }
}

// -----------------
// Prepare working dir
// -----------------
function prepareWorkingDir (binDir: string, workingDir: string) {
  // Copy mksnapshot files to temporary working directory because
  // v8_context_snapshot_generator expects to run everything from the same
  // directory.
  fs.copySync(binDir, workingDir)

  return path.join(binDir, 'mksnapshot_args')
}

function combineMksnapshotArgs (argsFilePath: string, mksnapshotArgs: string[]) {
  return processArgsFromFile(
    argsFilePath,
    mksnapshotArgs,
    workingDir,
    crossArchDirs,
  )
}

function prepareCommands (
  binDir: string,
  workingDir: string,
  mksnapshotArgs: string[],
) {
  const argsFilePath = prepareWorkingDir(binDir, workingDir)

  return combineMksnapshotArgs(argsFilePath, mksnapshotArgs)
}

// -----------------
// Run mksnapshot command to create snapshot_blob.bin
// -----------------
function createSnapshotBlob (
  mksnapshotBinaryDir: string,
  mksnapshotCommand: string,
  mksnapshotArgs: string[],
  outputDir: string,
) {
  const stdio: StdioOptions = 'inherit'
  const snapshotBlobOptions = {
    cwd: mksnapshotBinaryDir,
    env: process.env,
    stdio,
  }

  const cmd = `${mksnapshotCommand} ${mksnapshotArgs.join(' ')}`

  logInfo('Generating snapshot_blob.bin')
  logDebug({ mksnapshotBinaryDir, mksnapshotCommand, mksnapshotArgs })
  logDebug(cmd)

  const mksnapshotProcess = spawnSync(
    mksnapshotCommand,
    mksnapshotArgs,
    snapshotBlobOptions,
  )

  if (mksnapshotProcess.status !== 0) {
    logError(
      'Error running mksnapshot, exited with code %d.',
      mksnapshotProcess.status ?? 1,
    )

    logError(mksnapshotProcess.error)
    throw new Error(`
    Failed to create snapshot blob, investigate this by running: ${cmd}`)
  }

  // -----------------
  // Copy resulting snapshot_blob binary
  // -----------------
  fs.copyFileSync(
    path.join(mksnapshotBinaryDir, snapshotBlobFile),
    path.join(outputDir, snapshotBlobFile),
  )
}

// -----------------
// Run v8_context_snapshot_generator to generate v8_context_snapshot.bin
// -----------------
function createV8ContextSnapshot (
  mksnapshotBinaryDir: string,
  outputDir: string,
) {
  const v8ContextGenCommand = path.join(
    mksnapshotBinaryDir,
    isWindows
      ? 'v8_context_snapshot_generator.exe'
      : 'v8_context_snapshot_generator',
  )

  const v8ContextGenArgs = [
    `--output_file=${path.join(outputDir, v8ContextFile)}`,
  ]

  const stdio: StdioOptions = 'inherit'
  const v8ContextGenOptions = {
    cwd: mksnapshotBinaryDir,
    env: process.env,
    stdio,
  }

  const cmd = `${v8ContextGenCommand} ${v8ContextGenArgs.join(' ')}`

  logInfo(`Generating ${v8ContextFile}`)
  logDebug(cmd)

  const v8ContextGenProcess = spawnSync(
    v8ContextGenCommand,
    v8ContextGenArgs,
    v8ContextGenOptions,
  )

  if (v8ContextGenProcess.status !== 0) {
    logError(
      'Error running v8 context snapshot generator, exited with code %d.',
      v8ContextGenProcess.status ?? 1,
    )

    logError(v8ContextGenProcess.error)
    throw new Error(
      `Failed to create v8 context snapshot, investigate this by running: ${cmd}`,
    )
  }
}

export function runMksnapshot (args: string[]) {
  logDebug('Provided args: %o', args)
  checkArgs(args)
  let { outputDir, mksnapshotArgs } = extractOutdir(args)

  const res = prepareCommands(binDir, workingDir, mksnapshotArgs)
  const { mksnapshotBinaryDir, mksnapshotCommand } = res

  mksnapshotArgs = res.mksnapshotArgs

  logDebug('Processed args: %o', mksnapshotArgs)

  createSnapshotBlob(
    mksnapshotBinaryDir,
    mksnapshotCommand,
    mksnapshotArgs,
    outputDir,
  )

  createV8ContextSnapshot(mksnapshotBinaryDir, outputDir)
}
