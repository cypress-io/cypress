<template>
  <RunsError
    v-if="!currentProject?.cloudProject"
    icon="error"
    :button-text="t('runs.errors.connectionFailed.button')"
    :button-icon="ConnectIcon"
    :message="t('runs.errors.connectionFailed.title')"
    @button-click="emit('reExecuteRunsQuery')"
  >
    <i18n-t
      scope="global"
      keypath="runs.errors.connectionFailed.description"
    >
      <ExternalLink href="https://www.cypressstatus.com/">
        {{ t('runs.errors.connectionFailed.link') }}
      </ExternalLink>
    </i18n-t>
  </RunsError>
  <RunsError
    v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectNotFound'"
    icon="error"
    :button-text="t('runs.errors.notFound.button')"
    :button-icon="ConnectIcon"
    :message="t('runs.errors.notFound.title')"
    @button-click="openLoginConnectModal({utmMedium: 'Runs Tab'})"
  >
    <i18n-t
      scope="global"
      keypath="runs.errors.notFound.description"
    >
      <CodeTag
        bg
        class="text-purple-500 bg-purple-50"
      >
        projectId: "{{ currentProject?.projectId }}"
      </CodeTag>
    </i18n-t>
  </RunsError>
  <template v-else-if="currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized'">
    <RunsError
      v-if="hasRequestedAccess"
      icon="access"
      :button-text="t('runs.errors.unauthorizedRequested.button')"
      :button-icon="SendIcon"
      :message="t('runs.errors.unauthorizedRequested.title')"
      button-disabled
    >
      {{ t('runs.errors.unauthorizedRequested.description') }}
    </RunsError>
    <RunsError
      v-else
      icon="access"
      :button-text="t('runs.errors.unauthorized.button')"
      :button-icon="SendIcon"
      :message="t('runs.errors.unauthorized.title')"
      @button-click="requestAccess"
    >
      {{ t('runs.errors.unauthorized.description') }}
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
import { useI18n } from '@cy/i18n'
import CodeTag from '@packages/frontend-shared/src/components/CodeTag.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const { openLoginConnectModal } = useUserProjectStatusStore()

const { t } = useI18n()

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
