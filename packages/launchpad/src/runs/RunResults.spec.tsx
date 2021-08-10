import RunResults from './RunResults.vue'

let results

describe('<RunResults />', () => {
  beforeEach(() => {
    results = { pass: 5, fail: 0, skip: 0, flake: 2 }
  })

  it('playground', () => {
    cy.mount(() => (<RunResults {...results}/>))
  })
})
