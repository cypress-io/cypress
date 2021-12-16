<template>
  <div v-if="specStore.activeSpec">
    <SpecRunner
      v-if="initialized"
      :gql="props.gql"
      :active-spec="specStore.activeSpec"
    />
  </div>
  <div v-else>
    Error, no spec matched!
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import type { SpecRunnerFragment } from '../generated/graphql'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import SpecRunner from './SpecRunner.vue'

const initialized = ref(false)
const specStore = useSpecStore()
const selectorPlaygroundStore = useSelectorPlaygroundStore()
const route = useRoute()

onMounted(async () => {
  await UnifiedRunnerAPI.initialize()
  initialized.value = true
})

onBeforeUnmount(() => {
  UnifiedRunnerAPI.teardown()
})

const props = defineProps<{
  gql: SpecRunnerFragment
}>()

watch(() => route.query.file, (queryParam) => {
  const spec = props.gql.currentProject?.specs?.edges.find((x) => x.node.relative === queryParam)?.node

  if (selectorPlaygroundStore.show) {
    const autIframe = getAutIframeModel()

    autIframe.toggleSelectorPlayground(false)
    selectorPlaygroundStore.setEnabled(false)
    selectorPlaygroundStore.setShow(false)
  }

  specStore.setActiveSpec(spec ?? null)
}, { immediate: true, flush: 'post' })
</script>
