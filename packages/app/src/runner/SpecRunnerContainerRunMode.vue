<template>
  <div v-if="specStore.activeSpec">
    <SpecRunnerRunMode
      v-if="initialized"
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
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import SpecRunnerRunMode from './SpecRunnerRunMode.vue'
import type { SpecFile } from '@packages/types/src'

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
  runModeSpecs: SpecFile[]
}>()

watch(() => route.query.file, (queryParam) => {
  const spec = props.runModeSpecs.find((x) => x.relative === queryParam)

  // if (selectorPlaygroundStore.show) {
  //   const autIframe = getAutIframeModel()

  //   autIframe.toggleSelectorPlayground(false)
  //   selectorPlaygroundStore.setEnabled(false)
  //   selectorPlaygroundStore.setShow(false)
  // }

  specStore.setActiveSpec(spec ?? null)
}, { immediate: true, flush: 'post' })
</script>
