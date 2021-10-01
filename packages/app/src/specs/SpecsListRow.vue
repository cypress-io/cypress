<template>
  {{ spec?.name }} - {{ spec.absolute }} - {{ spec.gitInfo?.lastModifiedHumanReadable }}
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { computed } from 'vue-demi'
import type { SpecListRowFragment } from '../generated/graphql'

gql`
fragment SpecListRow on SpecEdge {
  node {
    id
    absolute
    name
    gitInfo {
      author
      lastModifiedHumanReadable
    }
  }
}
`

const props = defineProps<{
  gql: SpecListRowFragment
}>()

const spec = computed(() => props.gql.node)
</script>
