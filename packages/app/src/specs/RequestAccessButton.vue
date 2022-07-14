<template>
  <Button
    v-if="projectConnectionStatus === 'UNAUTHORIZED'"
    :prefix-icon="SendIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    data-cy="request-access-button"
    @click="requestAccess"
  >
    {{ t("specPage.requestAccessButton") }}
  </Button>
  <Button
    v-else-if="projectConnectionStatus === 'ACCESS_REQUESTED'"
    :prefix-icon="SendIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    data-cy="access-requested-button"
    class="bg-gray-800 border-gray-800"
    disabled
  >
    {{ t("specPage.requestSentButton") }}
  </Button>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import { RequestAccessButtonFragment, RequestAccessButton_RequestAccessDocument, RequestAccessButton_AccessRequestedDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import { gql, useMutation } from '@urql/vue'
const { t } = useI18n()

const props = defineProps<{
  gql: RequestAccessButtonFragment
}>()

const projectId = computed(() => props.gql.currentProject?.projectId)
const hasRequestedAccess = computed(() => props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized' && props.gql.currentProject?.cloudProject?.hasRequestedAccess)

gql`
fragment RequestAccessButton on Query {
  currentProject {
    id
    projectId
    cloudProject {
      __typename
      ... on CloudProjectUnauthorized {
        message
        hasRequestedAccess
      }
    }
  }
}
`

gql`
mutation RequestAccessButton_RequestAccess( $projectId: String! ) {
  cloudProjectRequestAccess(projectSlug: $projectId) {
    __typename
    ... on CloudProjectUnauthorized {
      message
      hasRequestedAccess
    }
  }
}
`

/**
 * We aren't able to subscribe to the result of the RequestAccess mutation, so this separate mutation triggers a forced
 * fetch of cloud project data so the cache is updated. This ensures that the proper "hasRequestedAccess" state is reflected
 * across multiple instances of this component
 */
gql`
mutation RequestAccessButton_AccessRequested {
  refetchRemote {
    currentProject {
      id
      cloudProject {
        __typename
        ... on CloudProjectUnauthorized {
          message
          hasRequestedAccess
        }
      }
    }
  }
}
`

const projectConnectionStatus = computed(() => {
  if (hasRequestedAccess.value) {
    return 'ACCESS_REQUESTED'
  }

  return 'UNAUTHORIZED'
})

const requestAccessMutation = useMutation(RequestAccessButton_RequestAccessDocument)
const accessRequestedMutation = useMutation(RequestAccessButton_AccessRequestedDocument)

async function requestAccess () {
  if (projectId.value) {
    await requestAccessMutation.executeMutation({ projectId: projectId.value })

    // Execute follow-on mutation which forces a refetch of the "hasRequestedAccess" state of the cloud project
    accessRequestedMutation.executeMutation({})
  }
}

</script>
