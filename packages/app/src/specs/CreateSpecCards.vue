<template>
  <div class="flex flex-wrap pb-32px border-b-1 gap-32px children:mx-auto">
    <component v-for="generator in generators" :key="generator.id"
      :is="generator.card"
      @click="$emit('select', generator.id)"/>
  </div>
</template>

<script lang="ts" setup>
import { generatorList } from './generators'
import type { GeneratorId } from './generators'
import { computed } from 'vue'
import type { CreateSpecCardsFragment } from '../generated/graphql'
import { gql } from '@urql/vue'

const props = defineProps<{
  gql: CreateSpecCardsFragment
}>()

defineEmits<{
  (eventName: 'select', id: GeneratorId): void
}>()

const generators = computed(() => generatorList.filter(g => g.matches(props.gql.activeTestingType)))

gql`
fragment CreateSpecCards on App {
  activeTestingType
  activeProject {
    storybook {
      storybookRoot
    }
  }
}
`

</script>