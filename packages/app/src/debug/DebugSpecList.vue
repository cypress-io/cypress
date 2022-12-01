<template>
  <div
    v-for="spec in props.gql"
    :key="spec?.id"
  >
    Failed Spec
    <div
      v-for="test in spec?.testResults"
      :key="test?.id"
    >
      {{ test?.title }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/core'
import type { DebugSpecListFragment } from '../generated/graphql'

gql`
fragment DebugSpecList on TestForReviewSpec {
  id
  path
  testResults {
    id
    title(depth: 5)
    titleParts
    duration
  }
}
`

const props = defineProps<{
  gql: DebugSpecListFragment[]
}>()

</script>
