import { gql, useMutation } from '@urql/vue'
import { UsePromptManager_SetProjectPreferencesDocument, UsePromptManager_SetGlobalPreferencesDocument } from '../../generated/graphql'
import { CloudStatus, ProjectStatus, useUserProjectStatusStore } from '../../store/user-project-status-store'
import { isAllowedFeature } from '../../utils/isAllowedFeature'

gql`
mutation UsePromptManager_SetProjectPreferences($value: String!) {
  setPreferences(type: project, value: $value) {
    currentProject {
      id
      savedState
    }
  }
}
`

gql`
mutation UsePromptManager_SetGlobalPreferences($value: String!) {
  setPreferences(type: global, value: $value) {
    localSettings {
      preferences {
        majorVersionWelcomeDismissed
      }
    }
  }
}
`

type FeatureName = Parameters<typeof isAllowedFeature>[0]

export function usePromptManager () {
  const setProjectPreferencesMutation = useMutation(UsePromptManager_SetProjectPreferencesDocument)
  const setGlobalPreferencesMutation = useMutation(UsePromptManager_SetGlobalPreferencesDocument)
  const userProjectStatusStore = useUserProjectStatusStore()

  // TODO: get Nav CI prompts using this in #23768 and retire the old setPromptShown mutation
  function setPromptShown (slug: 'ci1' | 'orchestration1' | 'loginModalRecord') {
    return setProjectPreferencesMutation.executeMutation({ value: JSON.stringify({ promptsShown: { [slug]: Date.now() } }) })
  }

  function setMajorVersionWelcomeDismissed (majorVersion: string) {
    return setGlobalPreferencesMutation.executeMutation({ value: JSON.stringify({ majorVersionWelcomeDismissed: { [majorVersion]: Date.now() } }) })
  }

  const wrappedIsAllowedFeature = (featureName: FeatureName, state: CloudStatus | ProjectStatus) => {
    return isAllowedFeature(featureName, userProjectStatusStore, state)
  }

  const getEffectiveBannerState = (featureName: FeatureName) => {
    const cloudStatus = userProjectStatusStore.cloudStatus
    const projectStatus = userProjectStatusStore.projectStatus

    if (featureName === 'specsListBanner') {
      if (cloudStatus !== 'allTasksCompleted' && wrappedIsAllowedFeature('specsListBanner', cloudStatus)) {
        return cloudStatus
      }

      if (projectStatus !== 'allTasksCompleted' && wrappedIsAllowedFeature('specsListBanner', projectStatus)) {
        return projectStatus
      }
    }

    return null
  }

  return {
    setPromptShown,
    isAllowedFeature: wrappedIsAllowedFeature,
    setMajorVersionWelcomeDismissed,
    getEffectiveBannerState,
  }
}
