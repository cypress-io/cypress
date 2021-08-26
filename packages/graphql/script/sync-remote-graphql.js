#!/usr/bin/env node

// @ts-check
const minimist = require('minimist')
const rp = require('@cypress/request-promise')
const fs = require('fs')
const path = require('path')
const { buildSchema, introspectionFromSchema } = require('graphql')

const parsedArgv = minimist(process.argv)

const ENV_MAP = {
  dev: 'http://localhost:3000',
  staging: 'https://dashboard-staging.cypress.io',
  production: 'https://dashboard.cypress.io',
}

if (!parsedArgv.env || !ENV_MAP[parsedArgv.env]) {
  throw new Error(`Expected --env to be one of ${Object.keys(ENV_MAP).join(', ')}`)
}

rp.get(`${ENV_MAP[parsedArgv.env]}/test-runner-graphql-schema`).then((body) => {
  fs.writeFileSync(path.join(__dirname, '../schemas/cloud.graphql'), body)
  fs.writeFileSync(path.join(__dirname, '../src/generated/cloud-introspection.gen.json'), JSON.stringify(introspectionFromSchema(buildSchema(body))))
  process.exit(0)
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e.message)
  process.exit(1)
})
