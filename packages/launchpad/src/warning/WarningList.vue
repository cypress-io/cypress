<template>
  <Warning
    v-for="warning in warnings"
    :key="warning.key"
    :title="warning.title"
    :message="warning.message"
    @dismiss="dismissed[warning.key] = true"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/core'
import type { WarningListFragment } from '../generated/graphql'
import Warning from '../warning/Warning.vue'

gql`
fragment WarningList on Wizard {
  step
  warnings {
    title
    message
    setupStep
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

    return !hasBeenDismissed && !warning.setupStep || warning.setupStep === props.gql.step
  })
})
</script>
