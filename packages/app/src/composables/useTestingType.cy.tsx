import { UseTestingType_ActivateTestingTypeDocument } from '../generated/graphql'
import { useTestingType } from './useTestingType'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

describe('useTestingType', () => {
  /**
   * Stateful wrapper so composables run in `setup()` — @urql/vue `use*` helpers
   * require an active Vue effect scope (functional render has none).
   */
  const ComposableWrapper = defineComponent({
    name: 'ComposableWrapper',
    props: {
      useComposable: {
        type: Function as PropType<() => unknown>,
        required: true,
      },
      callback: {
        type: Function as PropType<(result: unknown) => void>,
        required: true,
      },
    },
    setup (props) {
      const result = props.useComposable()

      props.callback(result)

      return () => <div>Composable</div>
    },
  })

  const mountComposable = (composable: () => any) => {
    const callback = cy.stub().as('callback')

    cy.mount({
      name: 'composable',
      render () {
        return (
          <ComposableWrapper useComposable={composable} callback={callback} />
        )
      },
    })

    return cy.get('@callback').should('have.been.called').then((cb) => {
      return cy.wrap(callback.getCall(callback.callCount - 1).args[0]).as('result')
    })
  }

  beforeEach(() => {
    const activateTestingTypeStub = cy.stub().as('activateTestingType')

    cy.stubMutationResolver(UseTestingType_ActivateTestingTypeDocument, (defineResult, args) => {
      activateTestingTypeStub()

      return defineResult({ switchTestingTypeAndRelaunch: true })
    })

    cy.gqlStub.Query.currentProject = {
      id: 'abc123',
      currentTestingType: 'e2e',
      isCTConfigured: false,
      isE2EConfigured: false,
    } as any
  })

  it('supplies expected query data', () => {
    mountComposable(useTestingType).then(async (value) => {
      const result = value as unknown as ReturnType<typeof useTestingType>

      expect(result.activeTestingType.value).to.eql('e2e')
      expect(result.isCTConfigured.value).to.eql(false)
      expect(result.isE2EConfigured.value).to.eql(false)
      expect(result.viewedTestingType.value).to.eql('e2e')
    })
  })

  describe('viewTestingType', () => {
    context('target mode is not configured', () => {
      beforeEach(() => {
        cy.gqlStub.Query.currentProject = {
          id: 'abc123',
          currentTestingType: 'e2e',
          isCTConfigured: false,
        } as any
      })

      it('should toggle viewed mode', () => {
        mountComposable(useTestingType).then(async (value) => {
          const result = value as unknown as ReturnType<typeof useTestingType>

          expect(result.viewedTestingType.value).to.eql('e2e')

          await result.viewTestingType('component')

          expect(result.viewedTestingType.value).to.eql('component')
        })
      })
    })

    context('target mode is configured', () => {
      beforeEach(() => {
        cy.gqlStub.Query.currentProject = {
          id: 'abc123',
          currentTestingType: 'e2e',
          isE2EConfigured: true,
          isCTConfigured: true,
        } as any
      })

      it('should toggle active mode if not active mode', () => {
        mountComposable(useTestingType).then(async (value) => {
          const result = value as unknown as ReturnType<typeof useTestingType>

          expect(result.viewedTestingType.value).to.eql('e2e')

          await result.viewTestingType('component')
        })

        cy.get('@activateTestingType').should('have.been.calledOnce')
      })

      it('should toggle viewed mode if active mode', () => {
        mountComposable(useTestingType).then(async (value) => {
          const result = value as unknown as ReturnType<typeof useTestingType>

          expect(result.viewedTestingType.value).to.eql('e2e')

          await result.viewTestingType('e2e')
        })

        cy.get('@activateTestingType').should('not.have.been.called')
      })
    })
  })
})
