<template>
  <div class="rounded font-medium text-14px overflow-hidden children:leading-20px">
    <button
      v-for="message, idx in messages"
      :key="message.id"
      class="border-transparent font-medium outline-none border-1 my-1 transition duration-150 hocus:border-purple-300"
      style="padding: 1px 12px;"
      :class="{
        'rounded-l': idx === 0,
        'rounded-r': idx === messages.length - 1,
        'text-white bg-purple-500': idx === activeIdx,
        'text-gray-200 bg-gray-900': idx !== activeIdx
      }"
      @click="select(message, idx)"
      @keypress.enter.space="select(message, idx)"
    >
      {{ message.text }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface ToggleMessage {
  text: string
  id: string
}

const props = defineProps<{
  messages: ToggleMessage[]
}>()

const emit = defineEmits<{
  (e: 'select', value: { idx: number, message: ToggleMessage }): void
}>()

const activeIdx = ref(0)
const select = (message: ToggleMessage, idx: number) => {
  activeIdx.value = idx
  emit('select', { idx, message })
}
</script>
