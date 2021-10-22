<template>
  <SpecRunner
    v-if="initialized"
    :gql="props.gql"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { SpecRunnerFragment } from '../generated/graphql'
import { UnifiedRunnerAPI } from '../runner'
import SpecRunner from '../runs/SpecRunner.vue'

const initialized = ref(false)

onMounted(async () => {
  await UnifiedRunnerAPI.initialize()
  initialized.value = true
})

const props = defineProps<{
  gql: SpecRunnerFragment
}>()
</script>
