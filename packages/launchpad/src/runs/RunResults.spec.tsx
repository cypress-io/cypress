import RunResults from './RunResults.vue'

const results = { pass: 5, fail: 0, skip: 0, flake: 2 }

describe('<RunResults />', () => {
  it('playground', () => {
    cy.mount(() => (<RunResults {...results}/>))
  })
})
