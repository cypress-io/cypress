<template>
  <SpecRunnerOpenMode
    v-if="initialized && specStore.activeSpec"
    :gql="props.gql"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { SpecRunnerFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import SpecRunnerOpenMode from './SpecRunnerOpenMode.vue'
import { useUnifiedRunner } from './unifiedRunner'
import { useRouter, useRoute } from 'vue-router'
import { getPathForPlatform } from '../paths'

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

const specStore = useSpecStore()
const router = useRouter()
const route = useRoute()

const specs = computed(() => {
  return props.gql.currentProject?.specs ?? []
})

const { initialized, watchSpecs } = useUnifiedRunner()

watchSpecs(specs)

specStore.$subscribe((mutation, state) => {
  const queryFile = getPathForPlatform(route.query.file as string)
  const shouldRedirect = route.name === 'SpecRunner' && queryFile && state.activeSpec === null

  if (shouldRedirect) {
    router.push({
      name: 'Specs',
      params: {
        unrunnable: queryFile,
      },
    })
  }
}, {
  immediate: true,
})

</script>
