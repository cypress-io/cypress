import SpecsListBanners from './SpecsListBanners.vue'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { SpecsListBannersFragment, SpecsListBannersFragmentDoc, UseCohorts_DetermineCohortDocument } from '../generated/graphql-test'
import interval from 'human-interval'
import { CloudUserStubs, CloudProjectStubs } from '@packages/graphql/test/stubCloudTypes'
import { AllowedState, BannerIds } from '@packages/types'
import { assignIn, set } from 'lodash'

const AlertSelector = 'alert-header'
const AlertCloseBtnSelector = 'alert-suffix-icon'

type BannerKey = keyof typeof BannerIds
type BannerId = typeof BannerIds[BannerKey]

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

  const stateWithFirstOpenedDaysAgo = (days: number) => {
    return {
      firstOpened: Date.now() - interval(`${days} days`),
    }
  }

  const mountWithState = (query: Partial<SpecsListBannersFragment>, state?: Partial<AllowedState>, props?: object) => {
    cy.mountFragment(SpecsListBannersFragmentDoc, {
      onResult: (result) => {
        assignIn(result, query)
        set(result, 'currentProject.savedState', state)
      },
      render: (gql) => <SpecsListBanners gql={gql} {...props} />,
    })
  }

  const validateSmartNotificationBehaviors = (bannerId: BannerId, bannerTestId: string, gql: Partial<SpecsListBannersFragment>) => {
    it('should not render when using cypress < 4 days', () => {
      mountWithState(gql, stateWithFirstOpenedDaysAgo(3))

      cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
    })

    it('should not render when previously-dismissed', () => {
      mountWithState(gql, {
        ...stateWithFirstOpenedDaysAgo(4),
        banners: {
          [bannerId]: {
            dismissed: Date.now(),
          },
        },
      })

      cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
    })

    context('banner conditions are met and when cypress use >= 4 days', () => {
      beforeEach(() => {
        cy.stubMutationResolver(UseCohorts_DetermineCohortDocument, (defineResult) => {
          return defineResult({ determineCohort: { __typename: 'Cohort', name: 'foo', cohort: 'A' } })
        })
      })

      it('should render when not previously-dismissed', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4))
        cy.get(`[data-cy="${bannerTestId}"]`).should('be.visible')
      })

      it('should be preempted by spec not found banner', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4), { isSpecNotFound: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
      })

      it('should be preempted by offline warning banner', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4), { isOffline: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
      })

      it('should be preempted by fetch error banner', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4), { isFetchError: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
      })

      it('should be preempted by project not found banner', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4), { isProjectNotFound: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
      })

      it('should be preempted by request access banner', () => {
        mountWithState(gql, stateWithFirstOpenedDaysAgo(4), { isProjectUnauthorized: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
      })
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
            savedState: {},
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

  describe('project unauthorized - access requested', () => {
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
              hasRequestedAccess: true,
            },
            savedState: {},
          }
        },
        render: (gql) => <SpecsListBanners gql={gql} isProjectUnauthorized={visible} hasRequestedAccess />,
      })
    })

    validateBaseRender()
    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })

  describe('login', () => {
    const gql: Partial<SpecsListBannersFragment> = {
      cloudViewer: null,
      cachedUser: null,
      currentProject: {
        __typename: 'CurrentProject',
        id: 'abc123',
      } as any,
    }

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_LOGIN, 'login-banner', gql)
  })

  describe('create organization', () => {
    const gql: Partial<SpecsListBannersFragment> = {
      cloudViewer: {
        ...CloudUserStubs.me,
        firstOrganization: {
          __typename: 'CloudOrganizationConnection',
          nodes: [],
        },
      },
      currentProject: {
        __typename: 'CurrentProject',
        id: 'abc123',
      } as any,
    }

    beforeEach(() => {
      cy.gqlStub.Query.cloudViewer = gql.cloudViewer as any
    })

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_CREATE_ORG, 'create-organization-banner', gql)
  })

  describe('connect project', () => {
    const gql: Partial<SpecsListBannersFragment> = {
      cloudViewer: {
        ...CloudUserStubs.me,
        firstOrganization: {
          __typename: 'CloudOrganizationConnection',
          nodes: [{ __typename: 'CloudOrganization', id: '987' }],
        },
      },
      currentProject: {
        __typename: 'CurrentProject',
        id: 'abc123',
        projectId: null,
      } as any,
    }

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_CONNECT_PROJECT, 'connect-project-banner', gql)
  })

  describe('record', () => {
    const gql: Partial<SpecsListBannersFragment> = {
      cloudViewer: {
        ...CloudUserStubs.me,
        firstOrganization: {
          __typename: 'CloudOrganizationConnection',
          nodes: [{ __typename: 'CloudOrganization', id: '987' }],
        },
      },
      currentProject: {
        __typename: 'CurrentProject',
        id: 'abc123',
        title: 'my-test-project',
        currentTestingType: 'component',
        projectId: 'abcd',
        cloudProject: {
          ...CloudProjectStubs.componentProject,
          runs: {
            __typename: 'CloudRunConnection',
            nodes: [],
          },
        },
      } as any,
    }

    beforeEach(() => {
      cy.gqlStub.Query.currentProject = gql.currentProject as any
      cy.gqlStub.Query.cloudViewer = gql.cloudViewer as any
    })

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_RECORD, 'record-banner', gql)
  })
})
