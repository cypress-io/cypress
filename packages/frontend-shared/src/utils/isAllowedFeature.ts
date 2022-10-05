import interval from 'human-interval'
import { BannerIds } from '@packages/types'
import type { LoginConnectStore } from '../store/login-connect-store'

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
}

/**
 *
 * @param eventTime - timestamp of an event
 * @param waitTime - time to compare with, such as `1 day`, `20 minutes`, etc, to be parsed by `human-interval` package
 */
const minTimeSinceEvent = (eventTime: number | undefined, waitTime: string) => {
  if (!eventTime) {
    // if there is no event time, the event has never been recorded
    // so the "time since" is infinite, return true here
    return true
  }

  // converting to lowercase since `interval` will error on "Day" vs "day"
  const waitTimestamp = interval(waitTime.toLocaleLowerCase())

  if (isNaN(waitTimestamp)) {
    throw new Error(`incorrect format for waitTime provided, value must be \`n days\`, \`n minutes\` etc. Value received was ${waitTime}`)
  }

  return (Date.now() - eventTime) > waitTimestamp
}

export const isAllowedFeature = (
  featureName: 'specsListBanner' | 'docsCiPrompt',
  loginConnectStore: LoginConnectStore,
) => {
  const {
    firstOpened,
    promptsShown,
    latestBannerShownTime,
    bannersState,
    userStatus,
    hasNonExampleSpec,
    userStatusIsNot,
  } = loginConnectStore

  const events = {
    cypressFirstOpened: firstOpened,
    navCiPromptAutoOpened: promptsShown.ci1,
    loginModalRecordPromptShown: promptsShown.loginModalRecord,
    latestSmartBannerShown: latestBannerShownTime,
  }

  function bannerForCurrentStatusWasNotDismissed () {
    const bannerId = bannerIds[userStatus]

    return !bannersState?.[bannerId]?.dismissed
  }

  function bannersAreNotDisabledForTesting () {
    return !bannersState?._disabled
  }

  // For each feature, we define an array of rules for every `UserStatus`.
  // The `base` rule is applied to all statuses, additional rules are
  // nested in their respective statuses.
  const rules = {
    specsListBanner: {
      base: [
        minTimeSinceEvent(events.cypressFirstOpened, '4 days'),
        minTimeSinceEvent(events.navCiPromptAutoOpened, '1 day'),
        bannerForCurrentStatusWasNotDismissed(),
        userStatusIsNot('allTasksCompleted'),
        bannersAreNotDisabledForTesting(),
      ],
      needsRecordedRun: [
        minTimeSinceEvent(events.loginModalRecordPromptShown, '1 day'),
        hasNonExampleSpec,
      ],
      needsOrgConnect: [],
      needsProjectConnect: [],
      isLoggedOut: [],
    },
    docsCiPrompt: {
      base: [
        minTimeSinceEvent(events.cypressFirstOpened, '4 days'),
        minTimeSinceEvent(events.latestSmartBannerShown, '1 day'),
      ],
      needsRecordedRun: [],
      needsOrgConnect: [],
      needsProjectConnect: [],
      isLoggedOut: [],
    },
  }

  let rulesToCheck = [...rules[featureName].base]

  if (userStatus !== 'allTasksCompleted') {
    rulesToCheck = rulesToCheck.concat(rules[featureName][userStatus])
  }

  return rulesToCheck.every((rule: boolean) => rule === true)
}
