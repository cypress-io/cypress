// __mocks__/fs.js
process.chdir('/')
module.exports = require('memfs').fs
