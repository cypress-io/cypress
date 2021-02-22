require('../../dist/support')

let originalRoot = window.top.document.querySelector('.ct-devtools-container')

beforeEach(() => {
  const autIframe = window.top.document.querySelector('.aut-iframe')
  const devtools = window.top.document.querySelector('.app')

  function waitOneSecond() {
    return new Cypress.Promise((resolve, reject) => {
      if (devtools) {
        console.log('Refresh')
        devtools.__vue__.refresh()
        resolve(true)
      } else {
        console.log('Remount')
        window.top.VueDevtoolsInline.inlineDevtools(originalRoot, autIframe, () => resolve(true))
      }
    })
  }

  cy.wrap(null).then(() => {
    // return a promise to cy.then() that
    // is awaited until it resolves
    return waitOneSecond()
  })
})

// beforeEach(() => {
//   let devtoolsActivated = Cypress.env('vueDevtools')
//   if (!devtoolsActivated) {
//     return
//   }

//   const mountDevtools = () => {
//     return new Cypress.Promise(done => {
//       const autIframe = window.top.document.querySelector('.aut-iframe')
//       const devtools = window.top.document.querySelector('.app')
//       let root = originalRoot

//       if (!originalRoot) {
//         // recreate
//         originalRoot = window.top.document.createElement('div')
//         originalRoot.className = 'ct-devtools-container'
//       }

//       // first mount devtools will *not* exist
//       if (devtools) {
//         root = originalRoot.cloneNode()
//         if (devtools.__vue__) {
//           console.log('DESTROY!!!')
//           devtools.__vue__.$destroy()
//         } else {
//           console.log('no dice', devtools, devtools.__vue__)
//         }
//         devtools.replaceWith(root)
//       } else {
//         console.log('Devtools not found!?')
//       }

//       if (autIframe) {
//         window.top.VueDevtoolsInline.inlineDevtools(root, autIframe, done)
//       } else {
//         throw Error('An error occurred when trying to initialize the Vue Devtools plugin.')
//       }
//     })
//   }

//   cy.wrap(null).then(() => {
//     console.log('Waiting...')
//     // wait until devtools have mounted before
//     // executing the test. This ensures we 
//     // capture all the events and other useful information.
//     return mountDevtools()
//   })
// })
