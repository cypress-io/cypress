const { detect } = require('../detect.ts')

detect(undefined, false).then((browsers) => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(browsers, null, 2))
})
