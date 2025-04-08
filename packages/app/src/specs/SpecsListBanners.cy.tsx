import { camelCase, assignIn, set } from 'lodash'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import SpecsListBanners from './SpecsListBanners.vue'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { SpecsListBannersFragment, SpecsListBannersFragmentDoc, UseCohorts_DetermineCohortDocument } from '../generated/graphql-test'
import interval from 'human-interval'
import { CloudUserStubs, CloudProjectStubs } from '@packages/graphql/test/stubCloudTypes'
import { AllowedState, BannerIds } from '@packages/types'
import { UserProjectStatusStore, useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import type { UserProjectStatusState } from '@packages/frontend-shared/src/store/user-project-status-store'

const AlertSelector = 'alert-header'
const AlertBody = 'alert-body'
const AlertCloseBtnSelector = 'alert-suffix-icon'

type BannerKey = keyof typeof BannerIds
type BannerId = typeof BannerIds[BannerKey]

describe('<SpecsListBanners />', { viewportHeight: 260, defaultCommandTimeout: 1000 }, () => {
  const validateBaseRender = (title: string, content: string) => {
    it('should render as expected', () => {
      cy.findByTestId(AlertSelector).should('be.visible').contains(title)
      cy.findByTestId(AlertBody).should('be.visible').contains(content)
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
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

      cy.mountFragment(SpecsListBannersFragmentDoc, {
        render: (gqlVal) => <SpecsListBanners gql={gqlVal} />,
      })

      cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
    })

    it('should not render when previously-dismissed', () => {
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setBannersState({
        [bannerId]: {
          dismissed: Date.now(),
        },
      })

      cy.mountFragment(SpecsListBannersFragmentDoc, {
        render: (gqlVal) => <SpecsListBanners gql={gqlVal} />,
      })

      cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
    })

    context('banner conditions are met and when cypress use >= 4 days', () => {
      beforeEach(() => {
        const userProjectStatusStore = useUserProjectStatusStore()

        userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('4 days'))

        cy.stubMutationResolver(UseCohorts_DetermineCohortDocument, (defineResult) => {
          return defineResult({ determineCohort: { __typename: 'Cohort', name: 'foo', cohort: 'A' } })
        })
      })

      it('should render when not previously-dismissed', () => {
        cy.mountFragment(SpecsListBannersFragmentDoc, {
          render: (gqlVal) => (<SpecsListBanners
            gql={gqlVal}
          />),
        })

        type DeepPartial<T> = {
          [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
        }

        const bannerTrueConditions: Record<string, DeepPartial<UserProjectStatusState>> = {
          'login': {},
          'create-organization': {
            user: { isLoggedIn: true, isOrganizationLoaded: true },
          },
          'connect-project': {
            user: { isLoggedIn: true, isMemberOfOrganization: true },
            project: { isConfigLoaded: true },
          },
          'record': {
            user: { isLoggedIn: true, isMemberOfOrganization: true },
            project: { isProjectConnected: true, hasNoRecordedRuns: true, hasNonExampleSpec: true, isConfigLoaded: true },
          },
          'component-testing': {
            testingType: 'e2e',
            user: { isLoggedIn: true, isMemberOfOrganization: true },
            project: { isProjectConnected: true, hasNonExampleSpec: true, isConfigLoaded: true, hasDetectedCtFramework: true },
          },
        }

        const userProjectStatusStore = useUserProjectStatusStore()

        const stateToSet = bannerTrueConditions[bannerTestId]

        Object.entries(stateToSet).forEach(([key, value]) => {
          if (key === 'user') {
            Object.entries(value).forEach(([key, value]) => userProjectStatusStore.setUserFlag(key as any, value))
          } else if (key === 'project') {
            Object.entries(value).forEach(([key, value]) => userProjectStatusStore.setProjectFlag(key as any, value))
          } else if (key === 'testingType') {
            userProjectStatusStore.setTestingType(value as any)
          }
        })

        cy.get(`[data-cy="${bannerTestId}-banner"]`)
        .should('be.visible')

        // The ct title has dynamic content and seems complicated to set here, so ignoring
        let ctBannerTitle = defaultMessages.specPage.banners.componentTesting.title

        if (ctBannerTitle) {
          defaultMessages.specPage.banners.componentTesting.title = ctBannerTitle.replace('{0}', 'React')
        }

        cy.wrap(Object.entries(defaultMessages.specPage.banners[camelCase(bannerTestId)])).each((entry) => {
          // @ts-expect-error
          cy.contains(entry[1]).should('be.visible')
        })
      })

      it('should be preempted by spec not found banner', () => {
        mountWithState(gql, {}, { isSpecNotFound: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
        cy.contains('Spec not found').should('exist')
      })

      it('should be preempted by offline warning banner', () => {
        mountWithState(gql, {}, { isOffline: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
        cy.contains('No internet connection').should('exist')
      })

      it('should be preempted by fetch error banner', () => {
        mountWithState(gql, {}, { isFetchError: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
        cy.contains('Lost connection').should('exist')
      })

      it('should be preempted by project not found banner', () => {
        mountWithState(gql, {}, { isProjectNotFound: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
        cy.contains('Couldn\'t find your project').should('exist')
      })

      it('should be preempted by request access banner', () => {
        mountWithState(gql, {}, { isProjectUnauthorized: true })
        cy.get(`[data-cy="${bannerTestId}"]`).should('not.exist')
        cy.contains('Request access').should('exist')
      })
    })
  }

  describe('spec not found', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))
      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} isSpecNotFound={visible} /> })
    })

    validateBaseRender(
      'Spec not found',
      'It is possible that the file has been moved or deleted. Please choose from the list of specs below.',
    )

    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })

  describe('offline', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} isOffline={visible} /> })
    })

    validateBaseRender(
      'No internet connection',
      'Please check your internet connection to resolve this issue. When your internet connection is fixed, we will automatically attempt to fetch the run metrics from Cypress Cloud.',
    )

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
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} onRefetchFailedCloudData={refetchCallback} isFetchError={visible} /> })
    })

    validateBaseRender(
      'Lost connection',
      `The request timed out or failed when trying to retrieve the recorded run metrics from Cypress Cloud. The information that you're seeing in the table below may be incomplete as a result.`,
    )

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
      const userProjectStatusStore = useUserProjectStatusStore()

      reconnectCallback = cy.stub(userProjectStatusStore, 'openLoginConnectModal')

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

      cy.mountFragment(SpecsListBannersFragmentDoc, { render: (gql) => <SpecsListBanners gql={gql} isProjectNotFound={visible} /> })
    })

    validateBaseRender(
      `Couldn't find your project`,
      'We were unable to find an existing project matching the projectId: "test-project-id" set in your Cypress config file. You can reconnect with an existing project or create a new project.',
    )

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
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

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
            currentTestingType: 'e2e',
            config: {},
          }
        },
        render: (gql) => <SpecsListBanners gql={gql} isProjectUnauthorized={visible} />,
      })
    })

    validateBaseRender(
      'Request access to project',
      'This is a private project that you do not currently have access to. Please request access from the project owner in order to view the list of runs.',
    )

    validateCloseControl()
    validateCloseOnPropChange(visible)
    validateReopenOnPropChange(visible)
  })

  describe('project unauthorized - access requested', () => {
    const visible: any = ref(true)

    beforeEach(() => {
      visible.value = true
      const userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setCypressFirstOpened(Date.now() - interval('3 days'))

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
            currentTestingType: 'e2e',
            config: {},
          }
        },
        render: (gql) => <SpecsListBanners gql={gql} isProjectUnauthorized={visible} hasRequestedAccess />,
      })
    })

    validateBaseRender(
      'Request access to project',
      `The owner of this project has been notified of your request. We'll notify you via email when your access request has been granted.`,
    )

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

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_LOGIN, 'login', gql)
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

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_CREATE_ORG, 'create-organization', gql)
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

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_CONNECT_PROJECT, 'connect-project', gql)
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

    validateSmartNotificationBehaviors(BannerIds.ACI_082022_RECORD, 'record', gql)
  })

  describe('component testing', () => {
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
        currentTestingType: 'e2e',
        projectId: 'abcd',
        cloudProject: {
          ...CloudProjectStubs.componentProject,
          runs: {
            __typename: 'CloudRunConnection',
            nodes: [{ __typename: 'CloudRun', id: 111 }],
          },
        },
        config: {
          component: {},
        },
      } as any,
      wizard: {
        __typename: 'Wizard',
        framework: {
          id: 'react',
          name: 'React',
          type: 'react',
        } as any,
        bundler: {
          id: 'bundler',
          name: 'webpack',
        },
      },
    }
    let userProjectStatusStore: UserProjectStatusStore

    beforeEach(() => {
      cy.gqlStub.Query.currentProject = gql.currentProject as any
      cy.gqlStub.Query.cloudViewer = gql.cloudViewer as any
      cy.gqlStub.Query.wizard = gql.wizard as any

      userProjectStatusStore = useUserProjectStatusStore()

      userProjectStatusStore.setUserFlag('isLoggedIn', true)
      userProjectStatusStore.setUserFlag('isMemberOfOrganization', true)
      userProjectStatusStore.setProjectFlag('isProjectConnected', true)
      userProjectStatusStore.setProjectFlag('hasDetectedCtFramework', true)
      userProjectStatusStore.setProjectFlag('isCTConfigured', false)
      userProjectStatusStore.setTestingType('e2e')

      cy.mountFragment(SpecsListBannersFragmentDoc, {
        render: (gqlVal) => <SpecsListBanners gql={gqlVal} />,
      })
    })

    validateBaseRender(
      'React component testing is available for this project',
      'You can now use Cypress to develop and test individual components without running your whole application. Generate the config in just a few clicks.',
    )

    validateCloseControl()
    validateSmartNotificationBehaviors(BannerIds.CT_052023_AVAILABLE, 'component-testing', gql)

    it('should not render when another smart banner has been dismissed within two days', () => {
      userProjectStatusStore.setBannersState({
        [BannerIds.ACI_082022_CONNECT_PROJECT]: {
          dismissed: Date.now() - interval('3 days'),
        },
      })

      cy.findByTestId('component-testing-banner').should('be.visible').then(() => {
        userProjectStatusStore.setBannersState({
          [BannerIds.ACI_082022_CONNECT_PROJECT]: {
            dismissed: Date.now() - interval('1 day'),
          },
        })

        cy.findByTestId('component-testing-banner').should('not.exist')
      })
    })
  })
})
