<template>
  <RunsError
    v-if="!currentProject?.cloudProject"
    icon="error"
    button-text="Try again"
    :button-icon="ConnectIcon"
    message="Cannot connect to Cypress Cloud"
    @button-click="emit('reExecuteRunsQuery')"
  >
    <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
    The request times out when trying to retrieve the recorded runs from Cypress Cloud. Please refresh the page to try again and visit our <ExternalLink href="https://www.cypressstatus.com/">Support page</ExternalLink> if this behavior continues.
  </RunsError>
  <RunsError
    v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectNotFound'"
    icon="error"
    button-text="Reconnect your project"
    :button-icon="ConnectIcon"
    message="Couldn't find your project"
    @button-click="openLoginConnectModal({utmMedium: 'Runs Tab'})"
  >
    We were unable to find an existing project matching the <CodeTag
      bg
      class="text-purple-500 bg-purple-50"
    >
      projectId: "{{ currentProject?.projectId }}"
    </CodeTag> set in your Cypress config file. You can reconnect with an existing project or create a new project.
  </RunsError>
  <template v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized'">
    <RunsError
      v-if="hasRequestedAccess"
      icon="access"
      button-text="Request Sent"
      :button-icon="SendIcon"
      message="Your access request for this project has been sent."
      button-disabled
    >
      The owner of this project has been notified of your request. We'll notify you via email when your access request has been granted.
    </RunsError>
    <RunsError
      v-else
      icon="access"
      button-text="Request access"
      :button-icon="SendIcon"
      message="Request access to view the recorded runs"
      @button-click="requestAccess"
    >
      This is a private project that you do not currently have access to. Please request access from the project owner in order to view the list of runs.
    </RunsError>
  </template>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import RunsError from './RunsError.vue'
import { RunsErrorRenderer_RequestAccessDocument } from '../generated/graphql'
import type { RunsErrorRendererFragment } from '../generated/graphql'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import CodeTag from '@packages/frontend-shared/src/components/CodeTag.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const { openLoginConnectModal } = useUserProjectStatusStore()

gql`
fragment RunsErrorRenderer on Query {
  currentProject {  
    id
    projectId
    cloudProject {
      __typename
      ... on CloudProjectNotFound {
        message
      }
      ... on CloudProjectUnauthorized {
        message
        hasRequestedAccess
      }
    }
  }
}
`

const props = defineProps<{
  gql: RunsErrorRendererFragment
}>()

const emit = defineEmits<{
  (e: 'reExecuteRunsQuery'): void
}>()

const currentProject = computed(() => props.gql.currentProject)

gql`
mutation RunsErrorRenderer_RequestAccess( $projectId: String! ) {
  cloudProjectRequestAccess(projectSlug: $projectId) {
    __typename
    ... on CloudProjectUnauthorized {
      message
      hasRequestedAccess
    }
  }
}
`

const hasRequestedAccess = ref(false)

onMounted(() => {
  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') {
    hasRequestedAccess.value = props.gql.currentProject.cloudProject.hasRequestedAccess ?? false
  }
})

const requestAccessMutation = useMutation(RunsErrorRenderer_RequestAccessDocument)

async function requestAccess () {
  const projectId = props.gql.currentProject?.projectId

  if (projectId) {
    const result = await requestAccessMutation.executeMutation({ projectId })

    if (result.data?.cloudProjectRequestAccess?.__typename === 'CloudProjectUnauthorized') {
      hasRequestedAccess.value = result.data.cloudProjectRequestAccess.hasRequestedAccess ?? false
    } else {
      hasRequestedAccess.value = false
    }
  }
}

</script>
