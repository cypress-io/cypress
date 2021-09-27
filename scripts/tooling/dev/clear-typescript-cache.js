#!/usr/bin/env node

/* eslint-disable no-console, no-empty */

// @ts-check
'use strict'

const { createConfig } = require('@packages/ts/config')
const confirm = require('inquirer-confirm')
const rmrf = require('rimraf')
const cacheDir = createConfig().cacheDir

;(async () => {
  console.error('Removing TypeScript cachedir "%s"', cacheDir)
  try {
    await confirm({
      question: 'Would you like to proceed? This will remove all cached files',
      default: false,
    })

    rmrf.sync(cacheDir)
  } catch (_) {}
})()
