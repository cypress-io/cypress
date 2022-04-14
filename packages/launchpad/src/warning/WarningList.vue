<template>
  <Warning
    v-for="warning in warnings"
    :key="warning.key"
    :title="warning.title ?? 'Warning'"
    :message="warning.errorMessage"
    :retryable="warning.retryable"
    dismissible
    @update:modelValue="dismiss(warning.key)"
    @retry="retry(warning)"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import { ErrorTypeEnum, WarningListFragment, WarningList_PingBaseUrlDocument } from '../generated/graphql'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import { useMutation } from '@urql/vue'

gql`
fragment WarningContent on ErrorWrapper {
  title
  errorType
  errorMessage
}
`

gql`
fragment WarningList on Query {
  warnings {
    ...WarningContent
  }
}`

gql`
mutation WarningList_removeWarning {
  dismissWarning {
    warnings {
      ...WarningContent
    }
  }
}
`

gql`
mutation WarningList_pingBaseUrl {
  pingBaseUrl {
    warnings {
      ...WarningContent
    }
  }
}
`

const props = defineProps<{
  gql: WarningListFragment
}>()

const pingBaseUrlMutation = useMutation(WarningList_PingBaseUrlDocument)

type Retryables = Partial<Record<ErrorTypeEnum, () => void>>

const retryables: Retryables = {
  'CANNOT_CONNECT_BASE_URL_WARNING': () => {
    pingBaseUrlMutation.executeMutation({})
  },
}

const dismissed = ref({})
const warnings = computed(() => {
  return props.gql.warnings
  .map((w) => ({ ...w, key: `${w.errorType}${w.errorMessage}`, ...(w.errorType in retryables ? { retryable: true } : {}) }))
  .filter((warning) => {
    const hasBeenDismissed = dismissed.value[warning.key]

    return !hasBeenDismissed
  })
})

const dismiss = (key) => {
  // TODO, call a mutation here so that the server persists the result of the mutation.
  // However, we still intend to keep the "warnings" dismissal so that the client updates immediately before the server responds.
  // UNIFY-1368
  dismissed.value[key] = true
}

const retry = (warning: typeof warnings.value[number]) => {
  retryables[warning.errorType]?.()
}
</script>
