Cypress.on('test:after:run', () => {
  console.log('test:after:run')
})

Cypress.on('test:after:run:async', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('test:after:run:async')
})
