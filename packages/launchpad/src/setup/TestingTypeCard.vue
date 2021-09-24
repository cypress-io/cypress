<template>
  <div
    class="flex flex-col w-full border border-gray-200 rounded p-30px text text-body-gray-500"
    :role="role"
  >
    <div class="border h-152px">
      <!-- temp wrapper for icon -->
      <component :is="icon" class="mx-auto mt-4" />
    </div>
    <h2 class="mt-4 text-primary text-18px">{{ title }}</h2>
    <p class="mt-3 text-sm" v-html="description + ' Aenean lacinia bibendum nulla sed consectetur. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Aenean lacinia bibendum nulla sed.'" />
    <div class="flex justify-between mt-4">
      <span class="flex items-center px-3 py-1 border rounded-full">
        <i-oi-clock class="mr-2 text-gray-300 w-14px h-14px" />8 min
      </span>
      <span class="border rounded-full pt-2px pl-4px text-body-gray-400 w-32px h-32px">
        <i-akar-icons-triangle-right class="h-24px w-24px" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TestingTypeEnum } from "../generated/graphql";
import { TestingTypeIcons } from "../utils/icons";

const props = defineProps<{
  id: TestingTypeEnum
  title: string
  description: string
  role: string
}>()

const icon = TestingTypeIcons[props.id]
</script>