/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
import { spawn, execSync } from 'child_process'
import chalk from 'chalk'
import pDefer from 'p-defer'
import path from 'path'
import fs from 'fs-extra'

const dataContextPackageRoot = path.join(__dirname, '..', '..')

interface NexusTypegenCfg {
  cwd: string
  /**
   * Path to the file we need to execute to generate the schema
   */
  filePath: string
  outputPath?: string
}

function prefixTypegen (s: string) {
  return `${chalk.cyan('nexusTypegen')}: ${s}`
}

async function windowsTouch (filename: string, time: Date) {
  // `fs.utimesSync` is used here to prevent existing file contents from being overwritten.
  // It also updates the last modification timestamp of the file, which is consistent with what POSIX touch does.
  try {
    fs.utimesSync(filename, time, time)
  } catch (e) {
    fs.closeSync(fs.openSync(filename, 'w'))
  }
}

async function nexusTypegen (cfg: NexusTypegenCfg) {
  const dfd = pDefer()

  if (cfg.outputPath) {
    await fs.ensureDir(path.join(dataContextPackageRoot, 'src/gen'))

    const pkgDataContext = path.join(dataContextPackageRoot, 'src/gen/cloud-source-types.gen.ts')

    // on windows there is no `touch` equivalent command
    if (process.platform === 'win32') {
      const time = new Date()

      await windowsTouch(pkgDataContext, time)
      await windowsTouch(cfg.outputPath, time)
    } else {
      execSync(`touch ${pkgDataContext}`)
      execSync(`touch ${cfg.outputPath}`)
    }
  }

  const nodeCmd = `node${process.platform === 'win32' ? '.cmd' : ''}`
  const out = spawn(nodeCmd, ['-r', '@packages/ts/register', cfg.filePath], {
    cwd: cfg.cwd,
    env: {
      ...process.env,
      CYPRESS_INTERNAL_NEXUS_CODEGEN: 'true',
      TS_NODE_CACHE: 'false',
    },
    ...process.platform === 'win32' ? { shell: true } : {},
  })

  out.stderr.on('data', (data) => {
    process.stdout.write(prefixTypegen(chalk.red(String(data))))
    dfd.resolve({})
  })

  out.stdout.on('data', (data) => {
    const outString = String(data)
    .split('\n')
    .map((s) => prefixTypegen(chalk.magentaBright(s)))
    .join('\n')

    process.stdout.write('\n')
    process.stdout.write(outString)
    process.stdout.write('\n')
    dfd.resolve({})
  })

  out.on('error', dfd.reject)

  return dfd.promise
}

export async function nexusCodegen () {
  return nexusTypegen({
    cwd: dataContextPackageRoot,
    filePath: path.join(dataContextPackageRoot, 'graphql/schema.ts'),
    outputPath: path.join(dataContextPackageRoot, 'src/gen/nxs.gen.ts'),
  })
}
