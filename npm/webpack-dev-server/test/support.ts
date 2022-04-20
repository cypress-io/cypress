import { restoreLoadHook } from '../src/helpers/sourceRelativeWebpackModules'

beforeEach(() => {
  delete require.cache
  restoreLoadHook()
})

after(() => {
  restoreLoadHook()
})
