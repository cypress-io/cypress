import Bluebird from 'bluebird'
import fsExtra from 'fs-extra'

export default Bluebird.promisifyAll(fsExtra) as any
