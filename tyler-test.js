const CRI = require('chrome-remote-interface')

// 1. Launch firefox
// start 'C:\Program Files (x86)\Mozilla Firefox\firefox.exe' 'about:blank', '--remote-debugging-port=51959'
//
// 2. Run script

const run = async () => {
  const versionInfo = await CRI.Version({ host: '127.0.0.1', port: 51959 })

  console.log('')
  console.log('version info')
  console.log(versionInfo)

  cri = await CRI({
    target: versionInfo.webSocketDebuggerUrl,
    local: true,
  })

  console.log('got client: ' + !!cri)

  const targets = await cri.send('Target.getTargets')
  
  console.log('')
  console.log('targets')
  console.log(targets)
  console.log('')
  console.log('//////////////////////')

}

try {
  run()
} catch (e) {
  // crap
  console.log(e)
}