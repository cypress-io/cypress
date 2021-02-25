if (module) {
  module.hot.accept(() => {
    window.location.reload()
  })
}

function run () {
  document.body.innerText = Math.random().toFixed(2)
  // import(() => './cypress/components/smoke.spec.js').then(code => {
  //   console.log('code', code)
  // })
}

run()
