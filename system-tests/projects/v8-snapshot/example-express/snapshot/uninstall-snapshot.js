// @ts-check

'use strict'
const path = require('path')
const { uninstallSnapshot } = require('../../')

const projectBaseDir = path.join(__dirname, '../')

;(() => {
  try {
    uninstallSnapshot(projectBaseDir)
  } catch (err) {
    console.error(err)
  }
})()
