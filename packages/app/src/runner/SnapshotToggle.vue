<template>
  <div
    class="rounded font-medium text-[14px] overflow-hidden children:leading-[20px]"
    data-cy="snapshot-toggle"
  >
    <button
      v-for="message, idx in messages"
      :key="message.id"
      :data-cy-active-snapshot-toggle="idx === activeIndex ? 'true' : undefined"
      class="border-transparent font-medium outline-none border my-1 transition duration-150 hocus:border-purple-300"
      style="padding: 1px 12px;"
      :class="{
        'rounded-l': idx === 0,
        'rounded-r': idx === messages.length - 1,
        'text-white bg-purple-500': idx === activeIndex,
        'text-gray-200 bg-gray-900': idx !== activeIndex
      }"
      @click="select(message, idx)"
      @keypress.enter.space="select(message, idx)"
    >
      {{ message.text }}
    </button>
  </div>
</template>

<script lang="ts" setup>

interface ToggleMessage {
  text: string
  id: string
}

withDefaults(defineProps<{
  messages: ToggleMessage[]
  activeIndex?: number
}>(), { activeIndex: 0 })

const emit = defineEmits<{
  (e: 'select', value: { idx: number, message: ToggleMessage }): void
}>()

const select = (message: ToggleMessage, idx: number) => {
  emit('select', { idx, message })
}
</script>
