<template>
  <code class="relative text-gray-700 font-light border border-gray-100 flex items-center leading-40px px-16px rounded whitespace-nowrap overflow-hidden">
    <i-cy-terminal_x16 class="w-16px h-16px icon-dark-gray-500 icon-light-gray-100 mr-8px flex-shrink-0" />
    <span class="text-purple-500 mr-8px">
      {{ projectFolderName }}<template v-if="projectFolderName">:~</template>$
    </span>
    {{ command }}
    <div class="font-sans absolute top-0 right-0 bottom-0 opacity-gradient p-4px pl-32px">
      <CopyButton
        :text="command"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import CopyButton from './CopyButton.vue'

defineProps<{
  projectFolderName: string,
  command: string
}>()
</script>

<style lang="scss" scoped>
.opacity-gradient {
  background: linear-gradient(to right, rgba(255,255,255,.3) 0%, rgba(255,255,255, 1) 25%, rgba(255,255,255,1) 100%);
}
</style>
