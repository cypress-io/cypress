const path = require('path')

const replacementPath = path.join(__dirname, '../../screenshot-replacement.png')

module.exports = (on) => {
  on('after:screenshot', (details) => {
    if (details.testFailure) {
      return {
        path: replacementPath,
        dimensions: { width: 1, height: 1 },
        size: 1111,
      }
    }

    switch (details.name) {
      case 'replace-me':
        return {
          path: replacementPath,
          dimensions: { width: 2, height: 2 },
          size: 2222,
        }
      case 'ignored-values':
        return {
          multipart: true,
          name: 'changed',
        }
      case 'invalid-return':
        return 'invalid'
      default:
        return {}
    }
  })
}
