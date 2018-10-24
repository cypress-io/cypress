glob = require("glob")
Promise = require("bluebird")

module.exports = Promise.promisify(glob)
