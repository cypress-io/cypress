<template>
  <Warning
    v-for="warning in warnings"
    :key="warningKey(warning)"
    :title="warning.title"
    :message="warning.message"
    :dismiss="onDismiss(warning)"
  />
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { gql } from '@urql/core'
import type { WarningListFragment } from '../generated/graphql'
import Warning from '../warning/Warning.vue'

gql`
fragment WarningList on Query {
  warnings {
    title
    message
    setupStep
  }
}`

const props = defineProps<{
  gql: WarningListFragment
}>()

const dismissed = reactive({})

const warningKey = (warning) => `${warning.title}${warning.message}`

const onDismiss = (warning) => {
  return () => {
    dismissed[warningKey(warning)] = true
  }
}

const warnings = computed(() => {
  return props.gql.warnings.filter((warning) => {
    return (
      !dismissed[warningKey(warning)]
    )
  })
})
</script>
