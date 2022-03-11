<template>
  <div v-if="specStore.activeSpec && activeSpecTouched">
    <SpecRunnerOpenMode
      v-if="initialized"
      :gql="props.gql"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, watchEffect, ref } from 'vue'
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

const activeSpecTouched = ref(false)

watchEffect(() => {
  // return early if activeSpec was _never_ changed from null
  if (specStore.activeSpec && !activeSpecTouched.value) {
    activeSpecTouched.value = true

    return
  }

  const specPath = router.currentRoute.value.query.file

  if (specPath && !specStore.activeSpec && specs.value) {
    router.push({ name: 'Specs', params: {
      unrunnable: router.currentRoute.value.query.file as string,
    } })
  }
})
</script>
