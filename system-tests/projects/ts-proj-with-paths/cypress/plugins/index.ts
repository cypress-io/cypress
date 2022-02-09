import { appName } from '@app/main'

if (appName !== 'Best App Ever') {
  throw new Error('Path alias not working properly in plugins file!')
}

export default () => {}
