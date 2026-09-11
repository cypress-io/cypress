import commonjsExports from './commonjs-export'

if (commonjsExports.export1 !== 'export1' || commonjsExports.export2 !== 'export2') {
  throw new Error('Imported values do not match exported values')
}

module.exports = {
  'e2e': {
    'supportFile': false,
  },
}
