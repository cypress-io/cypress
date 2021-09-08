<template>
  <div class="p-4 min-w-650px mx-auto my-0">
    <Disclosure as="section" class="border-1 border-gray-300 rounded" v-slot="{ open }">
      <DisclosureButton data-testid="settings-card-header" class="settings-card-header bg-cool-gray-100 py-4 pl-6 pr-3 select-none cursor-pointer grid gap-4">
        <span class="grid self-center h-full">
          <Icon :icon="icon" class="self-center text-indigo-600 text-xl"/>
        </span>
        <div class="w-0.5px bg-gray-300 h-full"/>
        <div>
          <h2 data-testid="settings-card-title" class="col-start-3 text-xl text-indigo-600">{{ title }}</h2>
          <p data-testid="settings-card-description" class="text-gray-500 text-sm">{{ description }}</p>
        </div>
        <Icon :icon="IconCaret" class="transform transition-transform col-start-4 self-center text-xl text-gray-500" :class="{ 'rotate-90': !open, 'rotate-180': open }"/>
      </DisclosureButton>

      <!-- Content of the Settings Card -->
      <DisclosurePanel class="pl-6 pr-10 pt-6 pb-6 border-t-width-1px border-gray-300">
        <slot/>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>

<script lang="ts" setup>
  import IconCaret from 'virtual:vite-icons/mdi/caret'
  import Icon from '../components/icon/Icon.vue'
  import type { FunctionalComponent, SVGAttributes } from 'vue'
  import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
  
  defineProps<{
    title: string,
    description: string,
    icon: FunctionalComponent<SVGAttributes, {}>
  }>()

</script>

<style lang="scss" scoped>
.settings-card-header {
  width: 100%;
  grid-template-columns: auto auto 1fr auto;
}
</style>
