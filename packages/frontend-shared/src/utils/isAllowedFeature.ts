import interval from 'human-interval'
import { BannerIds } from '@packages/types'
import type { LoginConnectStore } from '../store'

const bannerIds = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
}

/**
 * Enures a cooldown period between two cypress-triggered events, if one has already happened
 * @param eventTime - timestamp of an event - if undefined, this function will always return true, no cooldown is needed
 * @param waitTime - time to compare with, such as `1 day`, `20 minutes`, etc, to be parsed by `human-interval` package
 */
const minTimeSinceEvent = (eventTime: number | undefined, waitTime: string) => {
  if (!eventTime) {
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
    cypressFirstOpened,
    promptsShown,
    latestBannerShownTime,
    bannersState,
    userStatus,
    project,
  } = loginConnectStore

  const events = {
    cypressFirstOpened,
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
        bannersAreNotDisabledForTesting(),
      ],
      needsRecordedRun: [
        minTimeSinceEvent(events.loginModalRecordPromptShown, '1 day'),
        project.hasNonExampleSpec,
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
      allTasksCompleted: [],
    },
  }

  const baseRules = [...rules[featureName].base]

  // if the `userStatus` is not explicitly listed for a feature, then
  // we don't have anything that we are allowed to show for that status
  // so the fallback rules array of [false] is used
  const statusSpecificRules = rules[featureName][userStatus] ?? [false]

  const rulesToCheck = baseRules.concat(statusSpecificRules)

  return rulesToCheck.every((rule: boolean) => rule === true)
}
