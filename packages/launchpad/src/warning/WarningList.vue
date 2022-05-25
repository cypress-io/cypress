<template>
  <Warning
    v-for="warning in props.gql.warnings"
    :key="warning.id"
    :title="warning.title ?? 'Warning'"
    :message="warning.errorMessage"
    :retryable="Boolean(retryables[warning.errorType])"
    dismissible
    @update:modelValue="dismiss(warning.id)"
    @retry="retry(warning)"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { ErrorTypeEnum, WarningContentFragment, WarningListFragment, WarningList_PingBaseUrlDocument, WarningList_RemoveWarningDocument } from '../generated/graphql'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import { useMutation } from '@urql/vue'

gql`
fragment WarningList on Query {
  warnings {
    id
    ...WarningContent
  }
}`

gql`
mutation WarningList_removeWarning($id: ID!) {
  dismissWarning(id: $id) {
    warnings {
      id
      ...WarningContent
    }
  }
}
`

gql`
mutation WarningList_pingBaseUrl {
  pingBaseUrl {
    warnings {
      id
      ...WarningContent
    }
  }
}
`

const props = defineProps<{
  gql: WarningListFragment
}>()

const pingBaseUrlMutation = useMutation(WarningList_PingBaseUrlDocument)
const dismissWarning = useMutation(WarningList_RemoveWarningDocument)

type Retryables = Partial<Record<ErrorTypeEnum, () => void>>

const retryables: Retryables = {
  'CANNOT_CONNECT_BASE_URL_WARNING': () => {
    pingBaseUrlMutation.executeMutation({})
  },
}

const dismiss = (id: string) => {
  if (!dismissWarning.fetching.value) {
    dismissWarning.executeMutation({ id })
  }
}

const retry = (warning: WarningContentFragment) => {
  retryables[warning.errorType]?.()
}
</script>
