import gulp from 'gulp'
import path from 'path'
import fs from 'fs'
import { minifyIntrospectionQuery } from '@urql/introspection'
import { buildSchema, introspectionFromSchema } from 'graphql'

const projectRoot = path.join(__dirname, '../..')

const APP_SCHEMA = path.join(projectRoot, 'packages/graphql/schemas/schema.graphql')

async function printUrqlSchema () {
  const schemaContents = await fs.promises.readFile(APP_SCHEMA, 'utf8')

  await fs.promises.writeFile(
    path.join(projectRoot, 'packages/launchpad/src/generated/urql-introspection.ts'),
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(buildSchema(schemaContents))), null, 2)} as const`,
  )
}

gulp.task(printUrqlSchema)

gulp.task('dev',
  gulp.series(
  // Watch the

    printUrqlSchema,
  ))
