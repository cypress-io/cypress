<template>
  <Alert
    type="dismissible"
    status="warning"
    data-testid="warning-alert"
    header-class="text-warning-600"
    :title="title"
    :icon="ErrorOutlineIcon"
    @suffixIconClicked="$emit('dismiss')"
  >
    <div
      ref="markdownTarget"
      v-html="markdown"
    />
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import Alert from '@cy/components/Alert.vue'
import { ref } from 'vue'

defineEmits<{
  (eventName: 'dismiss'): void
}>()

const props = defineProps<{
  title: string,
  message: string,
}>()

const markdownTarget = ref()
const { markdown } = useMarkdown(markdownTarget, props.message, { classes: { code: ['bg-warning-200'] } })
</script>
