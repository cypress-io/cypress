<template>
  <ul>
    <h2 class="mb-1 text-gray-900 text-size-16px">
      {{ header }}
    </h2>
    <li
      v-for="item, idx in items"
      :key="idx"
      class="truncate"
    >
      <Button
        class="text-left text-16px truncate w-full children:truncate children:leading-normal"
        variant="link"
        @click="emit('itemSelected', item)"
      >
        <slot :item="item" />
        <template #prefix>
          <div
            class="border-indigo-500 flex-grow bg-indigo-200 w-14px max-w-14px min-w-14px h-14px min-h-14px rounded-full border-width-2px"
          />
        </template>
      </Button>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'

const emit = defineEmits<{
  (event: 'itemSelected', item: Record<string, string>): void
}>()

defineProps<{
  items: Record<string, string>[]
  header: string
}>()
</script>
