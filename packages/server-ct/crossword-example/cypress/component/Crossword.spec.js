import { mount } from '@cypress/vue'
import Crossword from '@/components/Crossword'
import router from '@/router'
import store from '@/store'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import crosswords from '../fixtures/crosswords'

const board = '[data-testid=crossword]'
const loading = '[data-testid=crossword-skeleton]'

describe('Crossword', () => {
  before(() => {
    cy.server()
    cy.route('**/*.json', crosswords.previousCrossword)
  })

  it('renders', (done) => {
    store.dispatch('fetchCrossword')
    const data = { loading: true }

    mount({
      template: '<Crossword :loading="loading"/>',
      data () {
        return data
      },
      components: { Crossword },
    }, {
      plugins: [Vuex, VueRouter],
      router,
      store,
      stubs: {
        transition: false,
      },
    })

    cy.get(board).should('not.be.visible')
    cy.get(loading).should('be.visible')

    setTimeout(() => data.loading = false, 1000)

    cy.get(board).should('be.visible')
    cy.get(loading).should('not.be.visible')
    .then(() => done())
  })
})
