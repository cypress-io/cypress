#!/usr/bin/env node

// @ts-check
const minimist = require('minimist')
const rp = require('@cypress/request-promise')
const fs = require('fs')
const path = require('path')
const { buildSchema, introspectionFromSchema } = require('graphql')

const parsedArgv = minimist(process.argv)

const env = parsedArgv.env ?? 'production'

const ENV_MAP = {
  dev: 'http://localhost:3000',
  staging: 'https://dashboard-staging.cypress.io',
  production: 'https://dashboard-staging.cypress.io',
}

if (!ENV_MAP[env]) {
  throw new Error(`Expected --env to be one of ${Object.keys(ENV_MAP).join(', ')}`)
}

rp.get(`${ENV_MAP[env]}/test-runner-graphql-schema`).then((body) => {
  // TODO(tim): fix
  body = body.replace(/: DateTime/g, ': String')
  fs.writeFileSync(path.join(__dirname, '../schemas/cloud.graphql'), body)
  fs.writeFileSync(path.join(__dirname, '../src/gen/cloud-introspection.gen.json'), JSON.stringify(introspectionFromSchema(buildSchema(body)), null, 2))
  process.exit(0)
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e.message)
  process.exit(1)
})
