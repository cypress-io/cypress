const CRI = require('chrome-remote-interface')

const run = async () => {
  const versionInfo = await CRI.Version({ host: '127.0.0.1', port: 51959 })

  const cri = await CRI({
    target: versionInfo.webSocketDebuggerUrl,
    local: true,
  })

  const targets = await cri.send('Target.getTargets')
  
  console.log('found targets')
  console.log(targets)
}

try {
  run()
} catch (e) {
  console.log(e)
}
