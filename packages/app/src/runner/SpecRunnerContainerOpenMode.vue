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
import { computed, watchEffect } from 'vue'
import type { SpecRunnerFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import SpecRunnerOpenMode from './SpecRunnerOpenMode.vue'
import { useUnifiedRunner } from './unifiedRunner'
import { useRouter } from 'vue-router'

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

const specStore = useSpecStore()
const router = useRouter()

const { initialized, watchSpec } = useUnifiedRunner()

const specs = computed(() => {
  return props.gql.currentProject?.specs ?? []
})

watchSpec(specs)

watchEffect(() => {
  if (specStore && !specStore.activeSpec) {
    router.push({ name: 'Specs', params: {
      unrunnable: router.currentRoute.value.query.file as string,
    } })
  }
})
</script>
