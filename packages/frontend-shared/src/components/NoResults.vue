<template>
  <div v-if="search">
    <p>
      {{ message }}:
      <span class="text-purple-500">{{ search }}</span>.
    </p>

    <Button
      size="lg"
      variant="outline"
      @click="emit('clear')"
    >
      Clear Search
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from './Button.vue'

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
