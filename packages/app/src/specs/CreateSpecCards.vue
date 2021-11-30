<template>
  <div class="flex flex-wrap gap-32px children:mx-auto">
    <component
      :is="generator.card"
      v-for="generator in generators"
      :key="generator.id"
      :disabled="generator.disabled(props.gql.currentProject) || false"
      @click="$emit('select', generator.id)"
    />
  </div>
</template>

<script lang="ts" setup>
import { generatorList } from './generators'

// eslint-disable-next-line no-duplicate-imports
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

const generators = computed(() => generatorList.filter((g) => g.matches(props.gql.currentProject?.currentTestingType)))

gql`
fragment CreateSpecCards on Query {
  currentProject {
    id
    currentTestingType
    storybook {
      id
      storybookRoot
    }
  }
}
`

</script>
