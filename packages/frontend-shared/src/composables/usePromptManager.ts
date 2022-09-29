import { gql, useMutation } from '@urql/vue'
import { LoginConnect_SetPromptShownDocument } from '../generated/graphql'
import { useLoginConnectStore, UserStatus } from '@packages/frontend-shared/src/store/login-connect-store'
import interval from 'human-interval'

gql`
mutation LoginConnect_SetPromptShown($slug: String!) {
  setPromptShown(slug: $slug)
}
`

const minTimeSince = (eventTime, waitTime) => {
  return !eventTime || (Date.now() - eventTime) > interval(waitTime)
}

export function usePromptManager () {
  const setPromptShownMutation = useMutation(LoginConnect_SetPromptShownDocument)
  const loginConnectStore = useLoginConnectStore()

  const event = {
    'Cypress First Open': loginConnectStore.firstOpened,
    'Nav CI Prompt Auto Open': loginConnectStore.promptsShown.ci1,
    'Record Prompt Shown in Modal': loginConnectStore.promptsShown.loginModalRecord,
  }

  function setPromptShown (slug) {
    setPromptShownMutation.executeMutation({ slug })
  }

  const isAllowedFeature = (featureName: 'specsListBanner', statusName: UserStatus) => {
    const features = {
      specsListBanner: {
        base: [
          minTimeSince(event['Cypress First Open'], '4 days'),
          minTimeSince(event['Nav CI Prompt Auto Open'], '1 day'),
        ],
        needsRecordedRun: [
          minTimeSince(event['Record Prompt Shown in Modal'], '1 day'),
        ],
      },
    }

    return features[featureName][statusName].every((rule: boolean) => rule === true)
  }

  return {
    setPromptShown,
    isAllowedFeature,
  }
}
