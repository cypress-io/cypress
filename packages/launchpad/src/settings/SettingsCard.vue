<template>
  <div class="p-4 min-w-650px mx-auto my-0">
    <section class="border-1 border-gray-300 rounded overflow-hidden">

      <!-- The Settings Card Header -->
      <header @click="toggleOpen()" data-testid="settings-card-header" class="bg-cool-gray-100 py-4 pl-6 pr-3 select-none cursor-pointer grid gap-4">
        <span class="grid self-center h-full">
          <Icon :icon="icon" class="self-center text-indigo-600 text-xl"/>
        </span>
        <div class="w-0.5px bg-gray-300 h-full"/>
        <div>
          <h2 data-testid="settings-card-title" class="col-start-3 text-xl text-indigo-600">{{ title }}</h2>
          <p data-testid="settings-card-description" class="text-gray-500 text-sm">{{ description }}</p>
        </div>
        <Icon :icon="IconCaret" class="transform transition-transform col-start-4 self-center text-xl text-gray-500" :class="{ 'rotate-90': !isOpen, 'rotate-180': isOpen }"/>
      </header>

      <!-- Content of the Settings Card -->
      <div class="pl-6 pr-10 pt-6 pb-6 border-t-width-1px border-gray-300" v-if="isOpen">
        <slot/>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import IconCaret from 'virtual:vite-icons/mdi/caret'
  import Icon from '../components/icon/Icon.vue'
  import { useToggle } from '@vueuse/core'
  import type { IconType } from '../types'

  defineProps<{
    title: string,
    description: string,
    icon: IconType
  }>()

  const [ isOpen, toggleOpen ] = useToggle(false)

</script>

<style lang="scss" scoped>
header {
  grid-template-columns: auto auto 1fr auto;
}
</style>
