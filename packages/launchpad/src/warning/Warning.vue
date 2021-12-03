<template>
  <Alert
    v-if="show"
    dismissible
    type="warning"
    data-testid="warning-alert"
    header-class="text-warning-600"
    :title="title"
    @dismiss="dismiss"
  >
    <div
      ref="markdownTarget"
      v-html="markdown"
    />
  </Alert>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import Alert from '@cy/components/Alert.vue'

const emits = defineEmits<{
  (eventName: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  title: string,
  message: string,
  modelValue: boolean
}>(), { modelValue: true })

const markdownTarget = ref()
const { markdown } = useMarkdown(markdownTarget, props.message, { classes: { code: ['bg-warning-200'] } })

const show = ref(true)

function dismiss () {
  // TODO, call a mutation here so that the server persists the result of the mutation.
  // However, we still intend to keep the "warnings" dismissal so that the client updates immediately before the server responds.
  show.value = false
}
</script>
