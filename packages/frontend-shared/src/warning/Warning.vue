<template>
  <Alert
    v-model="show"
    :dismissible="dismissible"
    status="warning"
    data-cy="warning-alert"
    header-class="text-warning-600"
    :title="title"
    :icon="ErrorOutlineIcon"
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
import { computed, ref } from 'vue'
import { useVModels } from '@vueuse/core'

const emits = defineEmits<{
  (eventName: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  title: string,
  message: string,
  details?: string | null,
  modelValue?: boolean
  dismissible?: boolean
}>(), {
  modelValue: true,
  details: undefined,
  dismissible: true,
})

const { modelValue: show } = useVModels(props, emits)
const markdownTarget = ref()

let message = computed(() => {
  if (props.details) {
    return [props.message, `        ${ props.details }`].join('\n\n')
  }

  return props.message
})

const { markdown } = useMarkdown(markdownTarget, message.value, { classes: { code: ['bg-warning-200'] } })
</script>
