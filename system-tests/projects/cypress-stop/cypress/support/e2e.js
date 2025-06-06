before(() => {
  console.log('global before')
})

beforeEach(() => {
  console.log('global beforeEach')
})

afterEach(() => {
  console.log('global afterEach')
})

after(() => {
  console.log('global after')
})

Cypress.on('test:before:run:async', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('test:before:run:async')
})

Cypress.on('test:before:run', () => {
  console.log('test:before:run')
})

Cypress.on('test:before:after:run:async', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('test:before:after:run:async')
})

Cypress.on('test:after:run', () => {
  console.log('test:after:run')
})

Cypress.on('test:after:run:async', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log('test:after:run:async')
})
