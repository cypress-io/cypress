/* eslint-disable no-console */
import path from 'path'
import pDefer from 'p-defer'
import chalk from 'chalk'

import { nexusTypegen, watchNexusTypegen } from '../utils/nexusTypegenUtil'
import { monorepoPaths } from '../monorepoPaths'
import { spawned } from '../utils/childProcessUtils'
import { spawn } from 'child_process'

export async function nexusCodegen () {
  return nexusTypegen({
    cwd: monorepoPaths.pkgGraphql,
    filePath: path.join(monorepoPaths.pkgGraphql, 'src/schema.ts'),
    outputPath: path.join(monorepoPaths.pkgGraphql, 'src/gen/nxs.gen.ts'),
  })
}

/**
 * Watches & regenerates the
 */
export async function nexusCodegenWatch () {
  return watchNexusTypegen({
    cwd: monorepoPaths.pkgGraphql,
    watchPaths: [
      'src/**/*.ts',
    ],
    filePath: path.join(monorepoPaths.pkgGraphql, 'src/schema.ts'),
    outputPath: path.join(monorepoPaths.pkgGraphql, 'src/gen/nxs.gen.ts'),
  })
}

export async function graphqlCodegen () {
  return spawned('gql-codegen', 'yarn graphql-codegen --config graphql-codegen.yml', {
    cwd: monorepoPaths.root,
    waitForExit: true,
  })
}

export async function graphqlCodegenWatch () {
  const spawned = spawn('graphql-codegen', ['--watch', '--config', 'graphql-codegen.yml'], {
    cwd: monorepoPaths.root,
  })
  const dfd = pDefer()
  let hasResolved = false

  spawned.stdout.on('data', (chunk) => {
    const strs = `${chunk}`.split('\n').filter((f) => f)
    const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/
    const isFailureBlock = strs.some((s) => s.includes('[failed]'))

    strs.forEach((str) => {
      let codegenMsg = timestampRegex.test(str) ? str.slice(10) : str

      if (codegenMsg.includes('Watching for changes') && !hasResolved) {
        dfd.resolve({})
      }

      if (codegenMsg === str) {
        process.stdout.write(
          `${chalk.cyan('graphqlCodegen')}: ${chalk.gray(str)}\n`,
        )
      } else if (codegenMsg.startsWith(' Generate .') || isFailureBlock) {
        codegenMsg = codegenMsg.includes('[failed]')
          ? chalk.red(codegenMsg)
          : chalk.yellow(codegenMsg)

        process.stdout.write(`${chalk.cyan('graphqlCodegen')}: ${codegenMsg}\n`)
      }
    })
  })

  spawned.stderr.on('data', (data) => {
    console.error(chalk.red(String(data)))
  })

  return dfd.promise
}
