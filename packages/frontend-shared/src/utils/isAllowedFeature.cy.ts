import { isAllowedFeature } from './isAllowedFeature'
import { UserProjectStatusStore, useUserProjectStatusStore, CLOUD_STATUSES, ProjectStatus } from '../store'
import type { CloudStatus } from '../store'
import { BannerIds } from '@packages/types'
import interval from 'human-interval'

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
} as const

describe('isAllowedFeature', () => {
  let store: UserProjectStatusStore

  // this setup function acts as a test of the userStatus
  // getter in userProjectStatusStore, since we set the individual flags here
  // and assert on the expected user status derived from those flags
  // and provided by userProjectStatusStore.userStatus
  const setUpStatus = (status: CloudStatus | ProjectStatus) => {
    const { setCypressFirstOpened, setPromptShown, setTestingType, setUserFlag, setProjectFlag } = store

    // set a default valid number of days since first open & nav prompt shown
    // individual tests may override
    setCypressFirstOpened(Date.now() - interval('5 days'))
    setPromptShown('ci1', Date.now() - interval('5 days'))

    switch (status) {
      case 'isLoggedOut':
        setUserFlag('isLoggedIn', false)
        expect(store.cloudStatus).to.eq('isLoggedOut')
        break
      case 'needsOrgConnect':
        setUserFlag('isLoggedIn', true)
        setUserFlag('isOrganizationLoaded', true)
        expect(store.cloudStatus).to.eq('needsOrgConnect')
        break
      case 'needsProjectConnect':
        setUserFlag('isLoggedIn', true)
        setUserFlag('isMemberOfOrganization', true)
        setUserFlag('isOrganizationLoaded', true)
        setProjectFlag('isConfigLoaded', true)
        setProjectFlag('isProjectConnected', false)
        expect(store.cloudStatus).to.eq('needsProjectConnect')
        break
      case 'needsRecordedRun':
        setUserFlag('isLoggedIn', true)
        setUserFlag('isMemberOfOrganization', true)
        setProjectFlag('isProjectConnected', true)
        setProjectFlag('hasNoRecordedRuns', true)
        setProjectFlag('isConfigLoaded', true)
        setProjectFlag('hasNonExampleSpec', true)

        expect(store.cloudStatus).to.eq('needsRecordedRun')
        break
      case 'allTasksCompleted':
        setUserFlag('isLoggedIn', true)
        setUserFlag('isMemberOfOrganization', true)
        setProjectFlag('isProjectConnected', true)
        setProjectFlag('hasNoRecordedRuns', false)

        expect(store.cloudStatus).to.eq('allTasksCompleted')
        break
      case 'isComponentTestingCandidate':
        setTestingType('e2e')
        setUserFlag('isLoggedIn', true)
        setUserFlag('isMemberOfOrganization', true)
        setProjectFlag('isProjectConnected', true)
        setProjectFlag('hasNoRecordedRuns', false)
        setProjectFlag('isCTConfigured', false)
        setProjectFlag('hasDetectedCtFramework', true)

        expect(store.projectStatus).to.eq('isComponentTestingCandidate')
        break
      default:
        return
    }
  }

  beforeEach(() => {
    store = useUserProjectStatusStore()
    store.setProjectFlag('hasNonExampleSpec', true)
  })

  describe('specsListBanner', () => {
    context('at least one non-example spec has been written', () => {
      context('banners HAVE NOT been dismissed', () => {
        CLOUD_STATUSES.forEach((status) => {
          if (status === 'allTasksCompleted') {
            it('returns false when user has no actions to take', () => {
              setUpStatus('allTasksCompleted')
              const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

              expect(result).to.be.false
            })
          } else {
            it(`returns true for status ${status}`, () => {
              setUpStatus(status)
              const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

              expect(result).to.be.true
            })
          }
        })
      })

      context('banners HAVE been dismissed', () => {
        (Object.keys(bannerIds) as (keyof typeof bannerIds)[])
        .forEach((status) => {
          it(`returns false for banner ${ bannerIds[status] }`, () => {
            setUpStatus(status)

            // simulate banner for current status having been dismissed
            store.setBannersState({
              [bannerIds[status]]: {
                'dismissed': Date.now() - interval('1 day'),
              },
            })

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.false
          })
        })
      })

      context('banners have been disabled for testing', () => {
        CLOUD_STATUSES.forEach((status) => {
          it(`returns false for status ${ status }`, () => {
            setUpStatus(status)

            store.setBannersState({
              _disabled: true,
            })

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.false
          })
        })
      })

      context('cypress was first opened less than 4 days ago', () => {
        CLOUD_STATUSES.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setCypressFirstOpened(Date.now() - interval('3 days'))

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.false
          })
        })
      })

      context('nav CI prompt was shown less than one day ago', () => {
        CLOUD_STATUSES.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setPromptShown('ci1', Date.now() - interval('23 hours'))

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.false
          })
        })
      })
    })

    context('no non-example specs have been written', () => {
      CLOUD_STATUSES.forEach((status) => {
        if (status === 'allTasksCompleted' || status === 'needsRecordedRun') {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setProjectFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.false
          })
        } else {
          it(`returns true for status ${status}`, () => {
            setUpStatus(status)
            store.setProjectFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', store, store.cloudStatus)

            expect(result).to.be.true
          })
        }
      })
    })
  })

  describe('docsCiPrompt', () => {
    context('a banner WAS NOT shown in the last day', () => {
      CLOUD_STATUSES.forEach((status) => {
        it(`returns true with status ${ status } `, () => {
          setUpStatus(status)
          const result = isAllowedFeature('docsCiPrompt', store, store.cloudStatus)

          expect(result).to.be.true
        })
      })
    })

    context('a banner WAS shown in the last day', () => {
      CLOUD_STATUSES.forEach((status) => {
        it(`returns false with status ${ status } `, () => {
          setUpStatus(status)
          store.setLatestBannerShownTime(Date.now() - interval('23 hours'))
          const result = isAllowedFeature('docsCiPrompt', store, store.cloudStatus)

          expect(result).to.be.false
        })
      })
    })

    context('cypress was first opened less than 4 days ago', () => {
      CLOUD_STATUSES.forEach((status) => {
        it(`returns false for status ${ status } `, () => {
          setUpStatus(status)
          store.setCypressFirstOpened(Date.now() - interval('3 days'))
          const result = isAllowedFeature('docsCiPrompt', store, store.cloudStatus)

          expect(result).to.be.false
        })
      })
    })
  })
})
