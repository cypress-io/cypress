<template>
  <div
    v-if="search"
    class="text-center"
  >
    <img
      class="mx-auto mt-80px mb-36px w-344px"
      :src="noResultsImage"
      alt
    >
    <p class="text-gray-500 text-18px">
      {{ message }}:
      <span class="text-purple-500">{{ search }}</span>
    </p>
    <Button
      class="mx-auto mt-20px"
      size="lg"
      variant="outline"
      @click="emit('clear')"
    >
      <template #prefix>
        <i-cy-delete_x12 class="w-12px icon-dark-gray-400" />
      </template>
      Clear Search
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from './Button.vue'
import noResultsImage from '../assets/png/no-results.png'

withDefaults(defineProps<{
  search?: string,
  message?: string
}>(), {
  message: 'No results matched your search',
})

const emit = defineEmits<{
  (e: 'clear'): void
}>()

</script>
