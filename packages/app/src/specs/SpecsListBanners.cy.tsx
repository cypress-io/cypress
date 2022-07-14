import SpecsListBanners from './SpecsListBanners.vue'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { SpecsListBannersFragmentDoc } from '../generated/graphql-test'

const AlertSelector = 'alert-header'
const AlertCloseBtnSelector = 'alert-suffix-icon'

describe('<SpecsListBanners />', () => {
  const validateBaseRender = () => {
    it('should render as expected', () => {
      cy.findByTestId(AlertSelector).should('be.visible')
      cy.percySnapshot()
    })
  }

  const validateCloseControl = () => {
    it('should close alert when close control is clicked', () => {
      cy.findByTestId(AlertSelector).should('be.visible')
      cy.findByTestId(AlertCloseBtnSelector).click()

      cy.findByTestId(AlertSelector).should('not.exist')

      cy.percySnapshot()
    })
  }

  const validateCloseOnPropChange = (visible: Ref<boolean>) => {
    it('should close alert when input prop changes', () => {
      cy.findByTestId(AlertSelector).should('be.visible')
      .then(() => {
        visible.value = false
      })

      cy.findByTestId(AlertSelector).should('not.exist')
    })
  }

  const validateReopenOnPropChange = (visible: Ref<boolean>) => {
    it('should reopen alert when input prop changes', () => {
      cy.findByTestId(AlertSelector).should('be.visible')
      cy.findByTestId(AlertCloseBtnSelector).click()
      cy.findByTestId(AlertSelector).should('not.exist')
      .then(() => {
        visible.value = false
        visible.value = true
      })

      cy.findByTestId(AlertSelector).should('be.visible')
    })
  }

  describe('spec not found', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true
      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} isSpecNotFound={visible} /> })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })

  describe('offline', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true
      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} isOffline={visible} /> })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })

  describe('fetch error', () => {
    const visible: any = ref(true)
    let refetchCallback: () => void

    beforeEach(() => {
      visible.value = true
      refetchCallback = cy.stub()

      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} onRefetchFailedCloudData={refetchCallback} isFetchError={visible} /> })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)

    it('should trigger callback on button click', () => {
      cy.findByTestId('refresh-button').click()
      .then(() => {
        expect(refetchCallback).to.have.been.called
      })
    })
  })

  describe('project not found', () => {
    const visible: any = ref(true)
    let reconnectCallback: () => void

    beforeEach(() => {
      visible.value = true
      reconnectCallback = cy.stub()

      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} onReconnectProject={reconnectCallback} isProjectNotFound={visible} /> })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)

    it('should trigger callback on button click', () => {
      cy.findByTestId('reconnect-button').click()
      .then(() => {
        expect(reconnectCallback).to.have.been.called
      })
    })
  })

  describe('project unauthorized', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true

      cy.mountFragment(SpecsListBannersFragmentDoc, {
        onResult: (result) => {
          result.currentProject = {
            __typename: 'CurrentProject',
            id: 'abc123',
            projectId: 'abc123',
            cloudProject: {
              __typename: 'CloudProjectUnauthorized',
              message: 'test',
              hasRequestedAccess: false,
            },
          }
        },
        render: (gql) => <SpecsListBanners gql={gql} isProjectUnauthorized={visible} />,
      })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })
})
