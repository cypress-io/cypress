<template>
  <Collapsible
    class="border rounded bg-light-50 border-gray-100 w-full block
  overflow-hidden hocus-default"
    :max-height="maxHeight"
    lazy
    :data-cy="title"
  >
    <template #target="{ open }">
      <ListRowHeader
        class="cursor-pointer bg-gray-50"
        :class="{ 'border-b border-b-gray-100 rounded-b-none': open }"
        big-header
      >
        <template #icon>
          <component
            :is="icon"
            class="h-[24px] w-[24px] icon-dark-indigo-500 icon-light-indigo-200"
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
            class="max-w-[16px] transform transition duration-250 icon-dark-gray-300"
          />
        </template>
      </ListRowHeader>
    </template>
    <div
      data-cy="setting-expanded-container"
      class="divide-y space-y-[32px] divide-gray-100 p-[24px] children:pt-[24px] first:first:pt-0"
    >
      <slot />
    </div>
  </Collapsible>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import Collapsible from '@cy/components/Collapsible.vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'

defineProps<{
  title: string
  description: string
  icon: FunctionalComponent<SVGAttributes, {}>
  maxHeight: string
}>()

</script>

<style lang="scss" scoped>
.settings-card-header {
  grid-template-columns: auto auto 1fr auto;
}
</style>
