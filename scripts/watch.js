const chokidar = require('chokidar')
const childProcess = require('child_process')
const path = require('path')
const pDefer = require('p-defer')
const fs = require('fs')
const { introspectionFromSchema, buildSchema } = require('graphql')
const { minifyIntrospectionQuery } = require('@urql/introspection')

const APP_SCHEMA = 'packages/graphql/schemas/schema.graphql'

const watcher = chokidar.watch([
  'packages/graphql/src/**/*.{js,ts}',
  'packages/graphql/schemas/cloud.graphql',
  APP_SCHEMA,
], {
  cwd: path.join(__dirname, '..'),
  ignored: '**/nxs.gen.ts',
  ignoreInitial: true,
})

/**
 * @type {childProcess.ChildProcess}
 */
let child

let isClosing = false
let isRestarting = false

function runServer () {
  if (child) {
    child.removeAllListeners()
  }

  child = childProcess.fork(path.join(__dirname, 'start.js'), ['--devWatch', ...process.argv], {
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    if (isClosing) {
      process.exit(code)
    }
  })

  child.on('disconnect', () => {
    child = null
  })
}

function printAppSchema () {
  const schemaContents = fs.readFileSync(path.join(__dirname, '..', APP_SCHEMA), 'utf8')

  fs.writeFileSync(
    path.join(__dirname, '../packages/launchpad/src/generated/urql-introspection.ts'),
    `/* eslint-disable */\nexport const urqlSchema = ${JSON.stringify(minifyIntrospectionQuery(introspectionFromSchema(buildSchema(schemaContents))), null, 2)} as const`,
  )
}

async function restartServer (file) {
  // If the schema.graphql file has changed, we need to re-print the URQL introspection
  if (file === APP_SCHEMA) {
    printAppSchema()

    return
  }

  if (isRestarting) {
    return
  }

  const dfd = pDefer()

  if (child) {
    child.on('exit', dfd.resolve)
    isRestarting = true
    child.send('close')
  } else {
    dfd.resolve()
  }

  await dfd.promise
  isRestarting = false
  runServer()
}

watcher.on('add', restartServer)
watcher.on('change', restartServer)

runServer()
printAppSchema()

process.on('beforeExit', () => {
  isClosing = true
  child?.send('close')
})
