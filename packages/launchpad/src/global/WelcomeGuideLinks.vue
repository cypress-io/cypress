<template>
  <ul>
    <li :key="idx" v-for="item, idx in items">
      <Button
        @click="$emit('click', item)"
        class="text-left truncate max-w-400px children:truncate"
        variant="link"
      >
        <slot :item="item"></slot>
        <template #prefix>
          <div
            class="border-indigo-500 flex-grow bg-indigo-200 w-14px min-w-14px h-14px min-h-14px rounded-full border-width-2px"
          />
        </template>
      </Button>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import Button from '../components/button/Button.vue'

type Item = {
  [key: string]: string
}

defineProps<{
  items: Item[]
  header: string
}>()
</script>
