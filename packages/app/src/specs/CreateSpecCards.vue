<template>
  <div class="flex flex-wrap gap-[32px] children:mx-auto">
    <component
      :is="generator.card"
      v-for="generator in generators"
      :key="generator.id"
      @click="$emit('select', generator.id)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { GeneratorId, SpecGenerator } from './generators'
import type { CreateSpecCardsFragment } from '../generated/graphql'
import { gql } from '@urql/vue'

defineProps<{
  generators: SpecGenerator[]
  gql: CreateSpecCardsFragment
}>()

defineEmits<{
  (eventName: 'select', id: GeneratorId): void
}>()

gql`
fragment CreateSpecCards on Query {
  currentProject {
    id
    config
    codeGenGlobs {
      id
      component
    }
  }
}
`

</script>
