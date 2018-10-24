cp = require("child_process")
Promise = require("bluebird")

module.exports = Promise.promisifyAll(cp)
