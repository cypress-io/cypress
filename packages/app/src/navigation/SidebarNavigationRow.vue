<template>
  <a href="#"
      :class="[active ? 'before:bg-green-300' : 'before:bg-transparent']"
      class="w-full
      min-w-40px
      relative
      flex
      items-center
      rounded-md
      group
      focus-visible:outline-none
      hover:before:bg-indigo-300
      focus:before:bg-indigo-300
      before:content-open-square
      before:mr-4px
      before:rounded-r-md
      before:text-transparent
      before:h-40px
      before:w-4px">
    <span class="h-full
      flex
      items-center
      overflow-hidden
      p-8px
      gap-20px
      rounded-lg
      children:group-focus:text-indigo-300
      children:group-hover:text-indigo-300">
      <component v-if="icon" :is="icon"
      :class="[active ? 'text-green-300' : 'text-gray-500']"
      class="min-w-24px group-focus:text-indigo-300" />
      <span 
      :class="[active ? 'text-green-300' : 'text-gray-500']"
      class="truncate group-focus:text-white">
        <slot></slot>
      </span>
    </span>
  </a>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

withDefaults(defineProps <{
  icon?: unknown
  // Currently active row (generally the current route)
  active?: boolean
  }>(), {
  active: false
})
</script>
