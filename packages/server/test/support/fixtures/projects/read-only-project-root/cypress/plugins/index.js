const fs = require('fs')
const { expect } = require('chai')

module.exports = (on, config, mode) => {
  if (mode !== 'e2e') {
    throw Error('This is an e2e project. mode should be `e2e`.')
  }

  expect(process.geteuid()).to.not.eq(0)
  console.log('✅ not running as root')

  let err

  try {
    fs.accessSync(config.projectRoot, fs.constants.W_OK)
  } catch (e) {
    err = e
  }

  expect(err).to.include({ code: 'EACCES' })

  console.log(`✅ ${config.projectRoot} is not writable`)
}
