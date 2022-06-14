const CDP = require('chrome-remote-interface')

const run = async () => {
  const version = await CDP.Version()

  // console.log(version)
  // const browserClient = await CDP({ target: 'ws://localhost:65082/devtools/browser/5cbcd970-5980-4056-824f-f53f780ecf1b' })
  // console.log(browserClient)

  // const targets = await browserClient.send('Target.getTargets')
  
  // console.log(targets)
}

try {
  run()
} catch (e) {
  // crap
  console.log(e)
}