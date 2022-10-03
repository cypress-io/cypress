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
  let loginConnectStore: LoginConnectStore

  // this setup function acts as a test of the userStatus
  // getter in loginConnectStore, since we set the individual flags here
  // and assert on the expected user status derived from those flags
  // and provided by loginConnectStore.userStatus
  const setUpStatus = (status: UserStatus) => {
    switch (status) {
      case 'isLoggedOut':
        expect(loginConnectStore.userStatus).to.eq('isLoggedOut')
        break
      case 'needsOrgConnect':
        loginConnectStore.setFlag('isLoggedIn', true)
        loginConnectStore.setFlag('isOrganizationLoaded', true)
        expect(loginConnectStore.userStatus).to.eq('needsOrgConnect')
        break
      case 'needsProjectConnect':
        loginConnectStore.setFlag('isLoggedIn', true)
        loginConnectStore.setFlag('isMemberOfOrganization', true)
        expect(loginConnectStore.userStatus).to.eq('needsProjectConnect')
        break
      case 'needsRecordedRun':
        loginConnectStore.setFlag('isLoggedIn', true)
        loginConnectStore.setFlag('isMemberOfOrganization', true)
        loginConnectStore.setFlag('isProjectConnected', true)
        loginConnectStore.setFlag('hasNoRecordedRuns', true)

        expect(loginConnectStore.userStatus).to.eq('needsRecordedRun')
        break
      case 'allTasksCompleted':
        loginConnectStore.setFlag('isLoggedIn', true)
        loginConnectStore.setFlag('isMemberOfOrganization', true)
        loginConnectStore.setFlag('isProjectConnected', true)
        loginConnectStore.setFlag('hasNoRecordedRuns', false)

        expect(loginConnectStore.userStatus).to.eq('allTasksCompleted')
        break
      default:
        return
    }
  }

  beforeEach(() => {
    loginConnectStore = useLoginConnectStore()
    loginConnectStore.setFlag('hasNonExampleSpec', true)
  })

  describe('specsListBanner', () => {
    context('at least one non-example spec has been written', () => {
      context('banners HAVE NOT been dismissed', () => {
        userStatuses.forEach((status) => {
          if (status === 'allTasksCompleted') {
            it('returns false when user has no actions to take', () => {
              setUpStatus('allTasksCompleted')
              const result = isAllowedFeature('specsListBanner', loginConnectStore)

              expect(result).to.be.false
            })
          } else {
            it(`returns true for status ${status}`, () => {
              setUpStatus(status)
              const result = isAllowedFeature('specsListBanner', loginConnectStore)

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
            loginConnectStore.setBannersState({
              [bannerIds[status]]: {
                'dismissed': Date.now() - interval('1 day'),
              },
            })

            const result = isAllowedFeature('specsListBanner', loginConnectStore)

            expect(result).to.be.false
          })
        })
      })

      context('banners have been disabled for testing', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${ status }`, () => {
            setUpStatus(status)

            // _disabled is used as a helper in tests
            loginConnectStore.setBannersState({
              _disabled: true,
            })

            const result = isAllowedFeature('specsListBanner', loginConnectStore)

            expect(result).to.be.false
          })
        })
      })

      context('cypress was first opened less than 4 days ago', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            loginConnectStore.setFirstOpened(Date.now() - interval('3 days'))
            setUpStatus(status)
            const result = isAllowedFeature('specsListBanner', loginConnectStore)

            expect(result).to.be.false
          })
        })
      })

      context('nav CI prompt was shown less than one day ago', () => {
        userStatuses.forEach((status) => {
          it(`returns false for status ${status}`, () => {
            loginConnectStore.setPromptShown('ci1', Date.now() - interval('23 hours'))

            setUpStatus(status)
            const result = isAllowedFeature('specsListBanner', loginConnectStore)

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
            loginConnectStore.setFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', loginConnectStore)

            expect(result).to.be.false
          })
        } else {
          it(`returns true for status ${status}`, () => {
            setUpStatus(status)
            loginConnectStore.setFlag('hasNonExampleSpec', false)

            const result = isAllowedFeature('specsListBanner', loginConnectStore)

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
          const result = isAllowedFeature('docsCiPrompt', loginConnectStore)

          expect(result).to.be.true
        })
      })
    })

    context('a banner WAS shown in the last day', () => {
      userStatuses.forEach((status) => {
        it(`returns false with status ${ status } `, () => {
          setUpStatus(status)
          loginConnectStore.setLatestBannerShownTime(Date.now() - interval('23 hours'))
          const result = isAllowedFeature('docsCiPrompt', loginConnectStore)

          expect(result).to.be.false
        })
      })
    })

    context('cypress was first opened less than 4 days ago', () => {
      userStatuses.forEach((status) => {
        it(`returns false for status ${ status } `, () => {
          setUpStatus(status)
          loginConnectStore.setFirstOpened(Date.now() - interval('3 days'))
          const result = isAllowedFeature('docsCiPrompt', loginConnectStore)

          expect(result).to.be.false
        })
      })
    })
  })
})
