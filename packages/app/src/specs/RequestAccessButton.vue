<template>
  <Button
    v-if="projectConnectionStatus === 'UNAUTHORIZED'"
    size="32"
    class="gap-[8px]"
    data-cy="request-access-button"
    @click="requestAccess"
  >
    <IconObjectLetter />
    {{ t("specPage.requestAccessButton") }}
  </Button>
  <Button
    v-else-if="projectConnectionStatus === 'ACCESS_REQUESTED'"
    size="32"
    data-cy="access-requested-button"
    class="gap-[8px]"
    disabled
  >
    <IconObjectLetter />
    {{ t("specPage.requestSentButton") }}
  </Button>
</template>

<script setup lang="ts">
import Button from '@cypress-design/vue-button'
import { IconObjectLetter } from '@cypress-design/vue-icon'
import { RequestAccessButtonFragment, RequestAccessButton_RequestAccessDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import { gql, useMutation } from '@urql/vue'

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
      ... on CloudProject {
        id
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

const { t } = useI18n()

const props = defineProps<{
  gql: RequestAccessButtonFragment
}>()

const hasRequestedAccess = computed(() => props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized' && props.gql.currentProject?.cloudProject?.hasRequestedAccess)

const projectConnectionStatus = computed(() => {
  if (hasRequestedAccess.value) {
    return 'ACCESS_REQUESTED'
  }

  return 'UNAUTHORIZED'
})

const requestAccessMutation = useMutation(RequestAccessButton_RequestAccessDocument)

async function requestAccess () {
  const projectId = props.gql.currentProject?.projectId

  if (projectId) {
    await requestAccessMutation.executeMutation({ projectId })
  }
}

</script>
