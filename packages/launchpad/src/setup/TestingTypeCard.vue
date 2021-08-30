<template>
  <button
    class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
    :role="role"
  >
    <img
      :src="icon"
      class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
    />
    <p class="text-indigo-700 text-left mt-3 md:text-center">
      {{ title }}
    </p>
    <p 
      class="text-gray-400 text-sm text-left md:text-center" 
      v-html="description" 
    />
  </button>
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