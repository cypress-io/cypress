'use strict'

const path = require('path')
const fs = require('fs')
const entryFile = require.resolve('./app')

const { packherd } = require('../../../')

async function go() {
  const { bundle } = await packherd({ entryFile })
  const p = path.join(__dirname, 'bundle.js')
  fs.writeFileSync(p, bundle, 'utf8')
  console.error('Succesfully wrote bundle to %s', p)
}
go()
