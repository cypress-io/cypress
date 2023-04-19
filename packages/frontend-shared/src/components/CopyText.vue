<template>
  <code class="border rounded flex font-light bg-gray-50 border-gray-100 px-[16px] text-gray-600 text-[14px] leading-[40px] relative items-center whitespace-nowrap overflow-hidden">
    <i-cy-globe_x16 class="shrink-0 h-[16px] mr-[8px] w-[16px] icon-dark-gray-500 icon-light-gray-100" />
    {{ props.text }}
    <div class="font-sans opacity-gradient p-[4px] pl-[32px] top-0 right-0 bottom-0 absolute">
      <CopyButton
        class="bg-indigo-100"
        :text="text"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import CopyButton from '../gql-components/CopyButton.vue'

const props = defineProps<{
  text: string
}>()
</script>

<style lang="scss" scoped>
.opacity-gradient {
  background: linear-gradient(to right, rgba(255,255,255,.3) 0%, rgba(243, 244, 250, 1) 25%, rgba(243, 244, 250,1) 100%);
}
</style>
