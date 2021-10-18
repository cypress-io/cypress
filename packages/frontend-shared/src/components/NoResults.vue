<template>
  <p v-if="search">
    {{ message }}:
    <span class="text-purple-300">{{ search }}</span>
  </p>

  <Button
    size="lg"
    variant="outline"
    @click="emit('clear')"
  >
    Clear Search
  </Button>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'

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
