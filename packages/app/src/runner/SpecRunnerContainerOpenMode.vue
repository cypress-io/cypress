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

const redirectToError = () => {
  router.push({
    name: 'Specs',
    params: {
      unrunnable: router.currentRoute.value.query.file as string,
    },
  })
}

specStore.$subscribe((mutation, state) => {
  if (state.activeSpec === null) {
    redirectToError()
  }
}, {
  immediate: true,
})

</script>
