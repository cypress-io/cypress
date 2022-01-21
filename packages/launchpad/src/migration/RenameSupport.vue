<template>
  <div>SupportFile</div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/vue'
import type { RenameSupportFragment } from '../generated/graphql'

gql`
fragment RenameSupport on Migration {
  supportFileBefore
  supportFileAfter
}`

defineProps<{
  gql: RenameSupportFragment
}>()
</script>
