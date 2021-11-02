<template>
  <Collapsible
    class="block w-full mb-4 overflow-hidden border border-gray-100 rounded
  bg-light-50 hocus-default"
  >
    <template #target="{ open }">
      <ListRowHeader
        :class="{ 'border-b border-b-gray-100 rounded-b-none': open, 'bg-gray-50': true }"
        big-header
      >
        <template #icon>
          <component
            :is="icon"
            class="icon-dark-indigo-400 w-24px h-24px"
          />
        </template>
        <template #header>
          {{ title }}
        </template>
        <template #description>
          {{ description }}
        </template>
        <template #right>
          <i-cy-chevron-down
            :class="{ 'rotate-180': open }"
            class="transform max-w-16px icon-dark-gray-400"
          />
        </template>
      </ListRowHeader>
    </template>
    <div class="p-24px">
      <slot />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
// eslint-disable-next-line no-duplicate-imports
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Collapsible from '@cy/components/Collapsible.vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'

defineProps<{
  title: string,
  description: string,
  icon: FunctionalComponent<SVGAttributes, {}>
}>()

</script>

<style lang="scss" scoped>
.settings-card-header {
  grid-template-columns: auto auto 1fr auto;
}
</style>
