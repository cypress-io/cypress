<template>
  <div
    class="relative mt-3 min-w-25px cursor-pointer flex items-center justify-center overflow-hidden"
  >
    <!-- Can't do a border-left solution because you need to round the corners. -->
    <span class="absolute -left-7px rounded min-w-10px h-full" :class="{ 'bg-green-300': active }" />
    <Icon
      :icon="icon"
      class="pl-0.25rem py-0.25rem min-h-25px min-w-25px w-full h-full"
      :class="{
        'text-green-300': active
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from "vue"
import Icon from '../components/icon/Icon.vue'
import type { IconType } from '../types'
import type { HTMLAttributes } from 'vue'

interface Props extends HTMLAttributes {
  icon: IconType | string
  active?: boolean
}

defineProps<Props>()
</script>
  