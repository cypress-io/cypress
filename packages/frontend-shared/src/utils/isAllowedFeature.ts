import interval from 'human-interval'
import { BannerIds } from '@packages/types'
import type { UserProjectStatusStore, CloudStatus, ProjectStatus } from '../store'

type Feature = 'specsListBanner' | 'docsCiPrompt'
type RulesSet = { base: boolean[] } & Partial<Record<CloudStatus | ProjectStatus, boolean[]>>
type Rules = Record<Feature, RulesSet>
type BannerId = typeof BannerIds[keyof typeof BannerIds]

const BANNER_ID_BY_STATE: Partial<Record<CloudStatus | ProjectStatus, BannerId>> = {
  isLoggedOut: BannerIds.ACI_082022_LOGIN,
  needsOrgConnect: BannerIds.ACI_082022_CREATE_ORG,
  needsProjectConnect: BannerIds.ACI_082022_CONNECT_PROJECT,
  needsRecordedRun: BannerIds.ACI_082022_RECORD,
  isComponentTestingCandidate: BannerIds.CT_052023_AVAILABLE,
}

/**
 * Ensures a cooldown period between two cypress-triggered events, if one has already happened
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
  featureName: Feature,
  userProjectStatusStore: UserProjectStatusStore,
  state: CloudStatus | ProjectStatus = 'allTasksCompleted',
) => {
  const {
    cypressFirstOpened,
    promptsShown,
    latestBannerShownTime,
    bannersState,
    project,
  } = userProjectStatusStore

  const events = {
    cypressFirstOpened,
    navCiPromptAutoOpened: promptsShown.ci1,
    loginModalRecordPromptShown: promptsShown.loginModalRecord,
    latestSmartBannerShown: latestBannerShownTime,
  }

  function bannerForCurrentStatusWasNotDismissed () {
    if (!state) {
      return true
    }

    const bannerId = BANNER_ID_BY_STATE[state]

    if (!bannerId) {
      return true
    }

    return !bannersState?.[bannerId]?.dismissed
  }

  function noOtherSmartBannerShownWithin (interval: string) {
    const currentBannerId = BANNER_ID_BY_STATE[state]

    return Object.entries(BannerIds)
    .map(([_, bannerId]) => bannerId)
    .filter((bannerId) => bannerId !== currentBannerId)
    .map((bannerId) => bannersState[bannerId]?.dismissed)
    .every((bannerDismissed) => minTimeSinceEvent(bannerDismissed, interval))
  }

  function bannersAreNotDisabledForTesting () {
    return !bannersState?._disabled
  }

  // For each feature, we define an array of rules for every `BannerStatus`.
  // The `base` rule is applied to all statuses, additional rules are
  // nested in their respective statuses.
  const rules: Rules = {
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
      isComponentTestingCandidate: [
        noOtherSmartBannerShownWithin('2 days'),
      ],
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
      isComponentTestingCandidate: [],
    },
  }

  const baseRules = [...rules[featureName].base]

  // if the `userStatus` is not explicitly listed for a feature, then
  // we don't have anything that we are allowed to show for that status
  // so the fallback rules array of [false] is used
  const statusSpecificRules = (state && rules[featureName][state]) ?? [false]

  const rulesToCheck = baseRules.concat(statusSpecificRules)

  return rulesToCheck.every((rule: boolean) => rule === true)
}
