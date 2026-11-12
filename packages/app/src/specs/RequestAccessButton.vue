<template>
  <Button
    v-if="projectConnectionStatus === 'UNAUTHORIZED'"
    :prefix-icon="SendIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    data-cy="request-access-button"
    @click="requestAccess"
  >
    Request access
  </Button>
  <Button
    v-else-if="projectConnectionStatus === 'ACCESS_REQUESTED'"
    :prefix-icon="SendIcon"
    prefix-icon-class="icon-dark-white icon-light-transparent"
    data-cy="access-requested-button"
    class="btn-disabled"
    disabled
  >
    Request sent
  </Button>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import { RequestAccessButton_RequestAccessDocument } from '../generated/graphql'
import type { RequestAccessButtonFragment } from '../generated/graphql'
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

<style scoped>
/* Override <Button> classes, do not rely on css class order */
.btn-disabled {
  @apply bg-gray-800 border-gray-800;
}
</style>
