#!/usr/bin/env node

// @ts-check
'use strict'

const { transpileProject } = require('@packages/ts/build-ts')

const projectRoot = process.cwd()

;(async () => {
  try {
    await transpileProject(projectRoot)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
})()
