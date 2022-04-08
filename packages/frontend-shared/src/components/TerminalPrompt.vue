<template>
  <code class="border rounded flex font-normal border-gray-100 px-16px text-gray-700 leading-40px relative items-center whitespace-nowrap overflow-hidden">
    <i-cy-terminal_x16 class="flex-shrink-0 h-16px mr-8px w-16px icon-dark-gray-500 icon-light-gray-100" />
    <span class="mr-8px text-purple-500">
      {{ projectFolderName }}<template v-if="projectFolderName">:~</template>$
    </span>
    {{ command }}
    <div class="font-sans opacity-gradient p-4px pl-32px top-0 right-0 bottom-0 absolute">
      <CopyButton
        :text="command"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import CopyButton from '../gql-components/CopyButton.vue'

defineProps<{
  projectFolderName?: string
  command: string
}>()
</script>

<style lang="scss" scoped>
.opacity-gradient {
  background: linear-gradient(to right, rgba(255,255,255,.3) 0%, rgba(255,255,255, 1) 25%, rgba(255,255,255,1) 100%);
}
</style>
