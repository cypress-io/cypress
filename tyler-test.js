const CRI = require('chrome-remote-interface')

const run = async () => {
  cri = await CRI({
    target: 'ws://localhost:63351/devtools/browser/af053c3b-24a7-47b3-9010-0b7c08e21398',
    local: true,
  })

  // console.log(cri)
  // const browserClient = await CDP({ target: 'ws://localhost:65082/devtools/browser/5cbcd970-5980-4056-824f-f53f780ecf1b' })
  // console.log(browserClient)

  const targets = await cri.send('Target.getTargets')
  
  console.log(targets)
}

try {
  run()
} catch (e) {
  // crap
  console.log(e)
}