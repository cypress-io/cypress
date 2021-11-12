<template>
  <HeadingText
    :title="props.gql.title"
    :description="props.gql.description"
  />
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import type { WizardHeaderFragment } from '../generated/graphql'
import HeadingText from './HeadingText.vue'

const props = defineProps<{
  gql: WizardHeaderFragment
}>()
</script>
