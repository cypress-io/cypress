if (process.env.CYPRESS_ENV !== 'production') {
  require('@packages/ts/register')
}

import agent from './lib/agent'
import * as connect from './lib/connect'

export { agent }

export { connect }
