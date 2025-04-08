<template>
  <code class="border rounded flex font-normal border-gray-100 pl-[16px] pr-[4px] text-gray-700 leading-[40px] items-center whitespace-nowrap overflow-hidden">
    <i-cy-terminal_x16 class="shrink-0 h-[16px] mr-[8px] w-[16px] icon-dark-gray-500 icon-light-gray-100" />
    <span class="mr-[8px] text-purple-500">
      $
    </span>
    <input
      readonly="true"
      type="text"
      :value="command"
      data-cy="terminal-prompt-input"
      class="border-none flex-1"
      aria-label="Terminal command"
    >
    <div class="font-sans">
      <CopyButton
        :text="command"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import CopyButton from '../gql-components/CopyButton.vue'

defineProps<{
  command: string
}>()
</script>
