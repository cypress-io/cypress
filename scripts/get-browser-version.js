const versions = require('../browser-versions')
const channel = process.argv[2]

process.stdout.write(versions[channel])
