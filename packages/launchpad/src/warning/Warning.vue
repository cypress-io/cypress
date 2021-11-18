<template>
  <div
    data-cy="warning"
    class="rounded min-w-200px bg-warning-100 mb-5"
  >
    <h3 class="text-lg text-warning-600 font-medium flex items-center p-5 relative">
      <i-cy-status-errored-outline_x16 class="w-24px h-24px mr-2" /> {{ props.title }}
      <button
        aria-label="Dismiss"
        data-cy="dismiss"
        class="text-warning-500 hocus:text-warning-600 outline-none absolute w-32px
      h-32px right-8px top-8px flex items-center justify-center"
        @click="onDismiss"
      >
        <i-cy-delete_x12 class="icon-dark-current w-12px h-12px" />
      </button>
    </h3>
    <Markdown
      class="border-t border-warning-200 text-warning-500 py-5 mt-0 mx-5"
      code-class="bg-white bg-opacity-25 border-warning-300"
      :text="props.message"
    />
  </div>
</template>

<script lang="ts" setup>
import Markdown from '../components/markdown/Markdown.vue'

const props = defineProps<{
  title: string,
  message: string,
  dismiss: Function,
}>()

const onDismiss = () => {
  props.dismiss()
}
</script>
