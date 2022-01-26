<template>
  <div v-if="specStore.activeSpec">
    <SpecRunnerOpenMode
      v-if="initialized"
      :gql="props.gql"
    />
  </div>

  <div v-else>
    Error, no spec matched!
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { SpecRunnerFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import SpecRunnerOpenMode from './SpecRunnerOpenMode.vue'
import { useUnifiedRunner } from './unifiedRunner'

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

const specStore = useSpecStore()

const { initialized, watchSpec } = useUnifiedRunner()

const specs = computed(() => {
  return props.gql.currentProject?.specs ?? []
})

watchSpec(specs)
</script>
