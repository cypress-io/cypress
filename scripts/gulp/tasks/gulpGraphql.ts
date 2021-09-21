// @ts-expect-error - no types
import rp from '@cypress/request-promise'
import path from 'path'
import pDefer from 'p-defer'
import chalk from 'chalk'
import fs from 'fs-extra'
import { buildSchema, introspectionFromSchema } from 'graphql'
import { minifyIntrospectionQuery } from '@urql/introspection'

import { nexusTypegen, watchNexusTypegen } from '../utils/nexusTypegenUtil'
import { monorepoPaths } from '../monorepoPaths'
import { spawned } from '../utils/childProcessUtils'
import { spawn } from 'child_process'
import { CYPRESS_INTERNAL_CLOUD_ENV } from '../gulpConstants'

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

const ENV_MAP = {
  development: 'http://localhost:3000',
  staging: 'https://dashboard-staging.cypress.io',
  production: 'https://dashboard.cypress.io',
}

export async function syncRemoteGraphQL () {
  if (!ENV_MAP[CYPRESS_INTERNAL_CLOUD_ENV]) {
    throw new Error(`Expected --env to be one of ${Object.keys(ENV_MAP).join(', ')}`)
  }

  try {
    const body = await rp.get(`${ENV_MAP[CYPRESS_INTERNAL_CLOUD_ENV]}/test-runner-graphql-schema`)

    // TODO(tim): fix
    await fs.ensureDir(path.join(monorepoPaths.pkgGraphql, 'src/gen'))
    await fs.promises.writeFile(path.join(monorepoPaths.pkgGraphql, 'schemas/cloud.graphql'), body)
    await fs.promises.writeFile(path.join(monorepoPaths.pkgGraphql, 'src/gen/cloud-introspection.gen.json'), JSON.stringify(introspectionFromSchema(buildSchema(body)), null, 2))
  } catch {}
}

export async function printUrqlSchema () {
  const schemaContents = await fs.promises.readFile(path.join(monorepoPaths.pkgGraphql, 'schemas/schema.graphql'), 'utf8')

  const URQL_INTROSPECTION_PATH = path.join(monorepoPaths.pkgFrontendShared, 'src/generated/urql-introspection.gen.ts')

  await fs.ensureDir(path.dirname(URQL_INTROSPECTION_PATH))

  await fs.promises.writeFile(
    URQL_INTROSPECTION_PATH,
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(buildSchema(schemaContents))), null, 2)} as const`,
  )
}
