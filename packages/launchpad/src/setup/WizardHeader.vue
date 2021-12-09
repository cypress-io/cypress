<template>
  <h1 class="pt-20px font-medium text-center text-32px text-body-gray-900">
    {{ props.gql.title }}
  </h1>
  <p
    class="mx-42px mt-12px text-center text-body-gray-600 text-18px"
    v-html="props.gql.description"
  />
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import type { WizardHeaderFragment } from '../generated/graphql'

gql`
fragment WizardHeader on Wizard {
  title
  description
}
`

const props = defineProps<{
  gql: WizardHeaderFragment
}>()
</script>
