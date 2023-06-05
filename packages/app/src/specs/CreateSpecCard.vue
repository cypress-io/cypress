<template>
  <Card
    :disabled="disabled"
    :title="header"
    :description="description"
    :icon="icon"
    :icon-size="48"
    class="m-[2px] min-h-[216px] max-h-[350px] px-[32px] pt-[32px] pb-[24px]
  w-[280px]"
    variant="indigo"
    :badge-text="badgeText"
    @click="emits('click')"
  />
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Card from '@cy/components/Card.vue'

defineProps<{
  icon: FunctionalComponent<SVGAttributes>
  header: string
  description: string
  disabled?: boolean
  badgeText?: string
}>()

const emits = defineEmits<{
  (eventName: 'click'): void
}>()
</script>
