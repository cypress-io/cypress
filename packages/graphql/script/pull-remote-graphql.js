#!/usr/bin/env node

// @ts-check
const minimist = require('minimist')
const rp = require('@cypress/request-promise')
const fs = require('fs')
const path = require('path')

const parsedArgv = minimist(process.argv)

const ENV_MAP = {
  dev: 'http://localhost:3000',
  staging: 'https://dashboard-staging.cypress.io',
  production: 'https://dashboard.cypress.io',
}

if (!parsedArgv.env || !ENV_MAP[parsedArgv.env]) {
  throw new Error(`Expected --env to be one of ${Object.keys(ENV_MAP).join(', ')}`)
}

rp.get(`${ENV_MAP[parsedArgv.env]}/tr-graphql-schema`).then((body) => {
  fs.writeFileSync(path.join(__dirname, '../schemas/cloud.graphql'), body)
  process.exit(0)
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e.message)
  process.exit(1)
})
