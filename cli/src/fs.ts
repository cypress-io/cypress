import { Promise } from 'bluebird'
import fs from 'fs-extra'

module.exports = Promise.promisifyAll(fs)
