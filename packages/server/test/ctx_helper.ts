const { makeDataContext } = require('@packages/server/lib/makeDataContext')
const { setCtx } = require('@packages/data-context')

before(() => {
  setCtx(makeDataContext({ mode: 'open', modeOptions: {} }))
})
