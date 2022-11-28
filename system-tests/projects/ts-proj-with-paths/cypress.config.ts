import { appName } from '@app/main'

if (appName !== 'Best App Ever') {
  throw new Error('Path alias not working properly in config file!')
}

module.exports = {
  e2e: {
    supportFile: false,
  },
}
