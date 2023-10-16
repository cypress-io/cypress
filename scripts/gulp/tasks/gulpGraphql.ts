// @ts-expect-error - no types
import rp from '@cypress/request-promise'
import path from 'path'
import pDefer from 'p-defer'
import chalk from 'chalk'
import fs from 'fs-extra'
import { buildSchema, extendSchema, GraphQLSchema, introspectionFromSchema, isObjectType, parse } from 'graphql'
import { minifyIntrospectionQuery } from '@urql/introspection'

import { nexusTypegen, watchNexusTypegen } from '../utils/nexusTypegenUtil'
import { monorepoPaths } from '../monorepoPaths'
import { spawned, universalSpawn } from '../utils/childProcessUtils'
import { DEFAULT_INTERNAL_CLOUD_ENV } from '../gulpConstants'

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
    cwd: monorepoPaths.pkgGraphql,
    waitForExit: true,
  })
}

export async function graphqlCodegenWatch () {
  const spawned = universalSpawn('graphql-codegen', ['--watch', '--config', 'graphql-codegen.yml'], {
    cwd: monorepoPaths.pkgGraphql,
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
  staging: 'https://cloud-staging.cypress.io',
  production: 'https://cloud.cypress.io',
}

export async function syncRemoteGraphQL () {
  if (!ENV_MAP[DEFAULT_INTERNAL_CLOUD_ENV]) {
    throw new Error(`Expected --env to be one of ${Object.keys(ENV_MAP).join(', ')}`)
  }

  try {
    const body = await rp.get(`${ENV_MAP[DEFAULT_INTERNAL_CLOUD_ENV]}/test-runner-graphql-schema`)

    // TODO(tim): fix
    await fs.ensureDir(path.join(monorepoPaths.pkgGraphql, 'src/gen'))
    await fs.promises.writeFile(path.join(monorepoPaths.pkgGraphql, 'schemas/cloud.graphql'), body)
  } catch (error) {
    console.error('Could not sync remote GraphQL schema', error)
  }
}

/**
 * Generates the schema so the urql GraphCache is
 */
export async function generateFrontendSchema () {
  const schemaContents = await fs.promises.readFile(path.join(monorepoPaths.pkgGraphql, 'schemas/schema.graphql'), 'utf8')
  const schema = buildSchema(schemaContents, { assumeValid: true })
  const testExtensions = generateTestExtensions(schema)
  const extendedSchema = extendSchema(schema, parse(testExtensions))

  const URQL_INTROSPECTION_PATH = path.join(monorepoPaths.pkgDataContext, 'src/gen/urql-introspection.gen.ts')

  await fs.ensureDir(path.dirname(URQL_INTROSPECTION_PATH))
  await fs.ensureDir(path.join(monorepoPaths.pkgFrontendShared, 'src/generated'))
  await fs.writeFile(path.join(monorepoPaths.pkgFrontendShared, 'src/generated/schema-for-tests.gen.json'), JSON.stringify(introspectionFromSchema(extendedSchema), null, 2))

  await fs.promises.writeFile(
    URQL_INTROSPECTION_PATH,
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(schema)), null, 2)} as const`,
  )
}

/**
 * Adds two fields to the GraphQL types specific to testing
 *
 * @param schema
 * @returns
 */
function generateTestExtensions (schema: GraphQLSchema) {
  const objects: string[] = []
  const typesMap = schema.getTypeMap()

  for (const [typeName, type] of Object.entries(typesMap)) {
    if (!typeName.startsWith('__') && isObjectType(type)) {
      if (isObjectType(type)) {
        objects.push(typeName)
      }
    }
  }

  return `
    union TestUnion = ${objects.join(' | ')}

    extend type Query {
      testFragmentMember: TestUnion!
      testFragmentMemberList(count: Int = 2): [TestUnion!]!
    }
  `
}
