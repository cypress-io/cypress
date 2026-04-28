import type { WarningListFragment } from '../generated/graphql-test'
import { WarningListFragmentDoc } from '../generated/graphql-test'
import WarningList from './WarningList.vue'
import { reactive } from 'vue'
import { faker } from '@faker-js/faker'
import { WarningList_RemoveWarningDocument } from '../generated/graphql'

faker.seed(1)

const warningSelector = '[data-cy=warning-alert]'

const createWarning = (props = {}) => ({
  ...cy.gqlStub.ErrorWrapper,
  ...props,
})

const firstWarning = createWarning({ title: faker.hacker.ingverb(), errorMessage: faker.hacker.phrase(), id: 'Warning1' })
const secondWarning = createWarning({ title: faker.hacker.ingverb(), errorMessage: faker.hacker.phrase(), id: 'Warning2' })

/** Mutates reactive mountFragment gql; stubbed mutations usually do not update graphcache. */
function removeWarningById (fragment: WarningListFragment, dismissedWarningId: string) {
  const indexOfDismissed = fragment.warnings.findIndex(
    (warning) => warning.id === dismissedWarningId,
  )

  if (indexOfDismissed === -1) {
    return
  }

  fragment.warnings.splice(indexOfDismissed, 1)
}

describe('<WarningList />', () => {
  it('does not render warning if there are none', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = []

        return reactive(result) as WarningListFragment
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('not.exist')
  })

  it('renders multiple warnings', () => {
    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = [
          firstWarning,
          secondWarning,
        ]

        return reactive(result) as WarningListFragment
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
  })

  it('removes warning when dismissed', () => {
    // `gqlFrag` is shared between `stubMutationResolver` (registered first) and `mountFragment`
    // `onResult` (runs on mount). The mutation stub runs later, outside mountFragment setup, so
    // it has no lexical access to the fragment data unless we keep a handle in this outer scope.
    //
    // That handle must be the same reactive object `mountFragment` passes into `render` →
    // `WarningList`: graphcache usually does not merge `defineResult` into that query, so only
    // in-place mutations on this proxy (e.g. splice) notify Vue; swapping plain arrays on the
    // mutation result alone does not update what the component is bound to.
    let gqlFrag: WarningListFragment | undefined

    cy.stubMutationResolver(WarningList_RemoveWarningDocument, (defineResult, { id }) => {
      if (gqlFrag) {
        removeWarningById(gqlFrag, id)
      }

      return defineResult({
        dismissWarning: {
          __typename: 'Query',
          warnings: gqlFrag ? [...gqlFrag.warnings] : [],
        },
      })
    })

    cy.mountFragment(WarningListFragmentDoc, {
      onResult (result) {
        result.warnings = [firstWarning, secondWarning]
        // Same reference returned here is what urql exposes to `render`; assign so the stub
        // mutates this reactive object, not a disconnected copy.
        gqlFrag = reactive(result) as WarningListFragment

        return gqlFrag
      },
      render: (gqlVal) => <div class="p-4"><WarningList gql={gqlVal} /></div>,
    })

    cy.get(warningSelector).should('have.length', 2)
    cy.contains(firstWarning.errorMessage)

    cy.get('[data-cy=alert-suffix-icon]').first().click()
    cy.get(warningSelector).should('have.length', 1)
    cy.contains(firstWarning.errorMessage).should('not.exist')
  })
})
