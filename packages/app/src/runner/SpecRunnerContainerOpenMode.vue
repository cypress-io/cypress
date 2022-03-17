<template>
  <div class="bg-white top-0 left-0 z-20000 absolute">
    {{ specStore.specSetEvents }}
  </div>
  <template v-if="specStore.activeSpec">
    <SpecRunnerOpenMode
      v-if="initialized"
      :gql="props.gql"
    />
  </template>
  <template v-else-if="specStore.activeSpec === null">
    Hello, no spec is found, watcher should catch this and redirect
    {{ specStore.specSetEvents }}
  </template>

  <template v-else-if="typeof specStore.activeSpec === 'undefined'">
    activeSpec is undefined, this is the initial state
  </template>
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
