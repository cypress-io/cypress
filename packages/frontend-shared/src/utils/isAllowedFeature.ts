import interval from 'human-interval'
import { BannerIds } from '@packages/types'

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
}

function hasBannerBeenDismissed (bannersState, userStatus) {
  const bannerId = bannerIds[userStatus]

  return !!bannersState?._disabled || !!bannersState?.[bannerId]?.dismissed
}

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

  return (Date.now() - eventTime) > interval(waitTime)
}

export const isAllowedFeature = (featureName: 'specsListBanner' | 'docsCiPrompt', loginConnectStore) => {
  const events = {
    cypressFirstOpen: loginConnectStore.firstOpened,
    navCiPromptAutoOpen: loginConnectStore.promptsShown.ci1,
    loginModalRecordPromptShown: loginConnectStore.promptsShown.loginModalRecord,
    latestSmartBannerShown: loginConnectStore.latestBannerShownTime,
  }

  const rules = {
    specsListBanner: {
      base: [
        minTimeSinceEvent(events.cypressFirstOpen, '4 days'),
        minTimeSinceEvent(events.navCiPromptAutoOpen, '1 day'),
        !hasBannerBeenDismissed(loginConnectStore.bannersState, loginConnectStore.userStatus),
        (loginConnectStore.userStatus !== 'noActionableState'),
      ],
      needsRecordedRun: [
        minTimeSinceEvent(events.loginModalRecordPromptShown, '1 day'),
        loginConnectStore.hasNonExampleSpec,
      ],
      needsOrgConnect: [],
      needsProjectConnect: [],
      isLoggedOut: [],
    },
    docsCiPrompt: {
      base: [
        minTimeSinceEvent(events.cypressFirstOpen, '4 days'),
        minTimeSinceEvent(events.latestSmartBannerShown, '1 day'),
      ],
      needsRecordedRun: [],
      needsOrgConnect: [],
      needsProjectConnect: [],
      isLoggedOut: [],
    },
  }

  let rulesToCheck = [...rules[featureName].base]

  if (loginConnectStore.userStatus !== 'noActionableState') {
    rulesToCheck = rulesToCheck.concat(rules[featureName][loginConnectStore.userStatus])
  }

  return rulesToCheck.every((rule: boolean) => rule === true)
}
