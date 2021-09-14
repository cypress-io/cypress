<template>
  <h1 class="text-3xl pt-12 text-center">{{ props.gql.title }}</h1>
  <p 
    class="text-center text-gray-400 my-2 mx-10" 
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