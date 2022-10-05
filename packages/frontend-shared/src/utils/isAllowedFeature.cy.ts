import { isAllowedFeature } from './isAllowedFeature'
import { LoginConnectStore, useLoginConnectStore, userStatuses } from '../store/login-connect-store'
import type { UserStatus } from '../store/login-connect-store'
import { BannerIds } from '@packages/types'
import interval from 'human-interval'

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
}

describe('isAllowedFeature', () => {
  let store: LoginConnectStore

  // this setup function acts as a test of the userStatus
  // getter in loginConnectStore, since we set the individual flags here
  // and assert on the expected user status derived from those flags
  // and provided by loginConnectStore.userStatus
  const setUpStatus = (status: UserStatus) => {
    const { setFirstOpened, setPromptShown, setFlag } = store

    // set a default valid number of days since first open & nav prompt shown
    // individual tests may override
    setFirstOpened(Date.now() - interval('5 days'))
    setPromptShown('ci1', Date.now() - interval('5 days'))

    switch (status) {
      case 'isLoggedOut':
        setFlag('isLoggedIn', false)
        expect(store.userStatus).to.eq('isLoggedOut')
        break
      case 'needsOrgConnect':
        setFlag('isLoggedIn', true)
        setFlag('isOrganizationLoaded', true)
        expect(store.userStatus).to.eq('needsOrgConnect')
        break
      case 'needsProjectConnect':
        setFlag('isLoggedIn', true)
        setFlag('isMemberOfOrganization', true)
        expect(store.userStatus).to.eq('needsProjectConnect')
        break
      case 'needsRecordedRun':
        setFlag('isLoggedIn', true)
        setFlag('isMemberOfOrganization', true)
        setFlag('isProjectConnected', true)
        setFlag('hasNoRecordedRuns', true)

        expect(store.userStatus).to.eq('needsRecordedRun')
        break
      case 'allTasksCompleted':
        setFlag('isLoggedIn', true)
        setFlag('isMemberOfOrganization', true)
        setFlag('isProjectConnected', true)
        setFlag('hasNoRecordedRuns', false)

        expect(store.userStatus).to.eq('allTasksCompleted')
        break
      default:
        return
    }
  }

  beforeEach(() => {
    store = useLoginConnectStore()
    store.setFlag('hasNonExampleSpec', true)
  })

  describe('specsListBanner', () => {
    context('at least one non-example spec has been written', () => {
      context('banners HAVE NOT been dismissed', () => {
        userStatuses.forEach((status) => {
          if (status === 'allTasksCompleted') {
            it('returns false when user has no actions to take', () => {
              setUpStatus('allTasksCompleted')
              const result = isAllowedFeature('specsListBanner', store)

              expect(result).to.be.false
            })
          } else {
            it(`returns true for status ${status}`, () => {
              setUpStatus(status)
              const result = isAllowedFeature('specsListBanner', store)

              expect(result).to.be.true
            })
          }
        })
      })

      context('banners HAVE been dismissed', () => {
        userStatuses.forEach((status) => {
          if (status === 'allTasksCompleted') {
            // no banner matches this state, so nothing can be dismissed, skip it
            return
          }

          it(`returns false for status ${ status }`, () => {
            setUpStatus(status)

            // simulate banner for current status having been dismissed
            store.setBannersState({
              [bannerIds[status]]: {
                'dismissed': Date.now() - interval('1 day'),
              },
            })

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.false
          })
        })
      })

      context('banners have been disabled for testing', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${ status }`, () => {
            setUpStatus(status)

            store.setBannersState({
              _disabled: true,
            })

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.false
          })
        })
      })

      context('cypress was first opened less than 4 days ago', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setFirstOpened(Date.now() - interval('3 days'))

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.false
          })
        })
      })

      context('nav CI prompt was shown less than one day ago', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setPromptShown('ci1', Date.now() - interval('23 hours'))

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.false
          })
        })
      })
    })

    context('no non-example specs have been written', () => {
      userStatuses.forEach((status) => {
        if (status === 'allTasksCompleted' || status === 'needsRecordedRun') {
          it(`returns false for status ${status}`, () => {
            setUpStatus(status)
            store.setFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.false
          })
        } else {
          it(`returns true for status ${status}`, () => {
            setUpStatus(status)
            store.setFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', store)

            expect(result).to.be.true
          })
        }
      })
    })
  })

  describe('docsCiPrompt', () => {
    context('a banner WAS NOT shown in the last day', () => {
      userStatuses.forEach((status) => {
        it(`returns true with status ${ status } `, () => {
          setUpStatus(status)
          const result = isAllowedFeature('docsCiPrompt', store)

          expect(result).to.be.true
        })
      })
    })

    context('a banner WAS shown in the last day', () => {
      userStatuses.forEach((status) => {
        it(`returns false with status ${ status } `, () => {
          setUpStatus(status)
          store.setLatestBannerShownTime(Date.now() - interval('23 hours'))
          const result = isAllowedFeature('docsCiPrompt', store)

          expect(result).to.be.false
        })
      })
    })

    context('cypress was first opened less than 4 days ago', () => {
      userStatuses.forEach((status) => {
        it(`returns false for status ${ status } `, () => {
          setUpStatus(status)
          store.setFirstOpened(Date.now() - interval('3 days'))
          const result = isAllowedFeature('docsCiPrompt', store)

          expect(result).to.be.false
        })
      })
    })
  })
})
