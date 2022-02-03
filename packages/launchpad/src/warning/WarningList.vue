<template>
  <Warning
    v-for="warning in warnings"
    :key="warning.key"
    :title="warning.title"
    :message="warning.message"
    :details="warning.details"
    dismissible
    @update:modelValue="dismiss(warning.key)"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import type { WarningListFragment } from '../generated/graphql'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'

gql`
fragment WarningList on Query {
  warnings {
    title
    message
    details
  }
}`

const props = defineProps<{
  gql: WarningListFragment
}>()

const dismissed = ref({})
const warnings = computed(() => {
  return props.gql.warnings
  .map((w) => ({ ...w, key: `${w.title}${w.message}` }))
  .filter((warning) => {
    const hasBeenDismissed = dismissed.value[warning.key]

    return !hasBeenDismissed
  })
})

const dismiss = (key) => {
  // TODO, call a mutation here so that the server persists the result of the mutation.
  // However, we still intend to keep the "warnings" dismissal so that the client updates immediately before the server responds.
  dismissed.value[key] = true
}
</script>
