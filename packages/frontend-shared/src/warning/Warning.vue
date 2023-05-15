<template>
  <Alert
    v-model="show"
    :dismissible="dismissible"
    status="warning"
    data-cy="warning-alert"
    icon-classes="icon-dark-orange-400 h-[16px] w-[16px]"
    :title="title"
    :icon="ErrorOutlineIcon"
  >
    <div
      ref="markdownTarget"
      class="warning-markdown"
      v-html="markdown"
    />
    <DSButton
      v-if="retryable"
      size="32"
      class="gap-[8px]"
      @click="emits('retry')"
    >
      <IconActionRefresh />
      {{ t('warnings.retry') }}
    </DSButton>
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import Alert from '@cy/components/Alert.vue'
import DSButton from '@cypress-design/vue-button'
import { IconActionRefresh } from '@cypress-design/vue-icon'
import { computed, ref } from 'vue'
import { useVModels } from '@vueuse/core'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'update:modelValue', value: boolean): void
  (eventName: 'retry'): void
}>()

const props = withDefaults(defineProps<{
  title: string
  message: string
  details?: string | null
  modelValue?: boolean
  dismissible?: boolean
  retryable?: boolean
}>(), {
  modelValue: true,
  details: undefined,
  dismissible: true,
  retryable: false,
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

<style lang="scss">
// Add some extra margin to the <ul>
// TODO: ideally move this into `frontend-shared/src/composables/useMarkdown`
// It doesn't get applied when added there due to conflicting with other, higher priority rules.
.warning-markdown {
  ul {
    @apply ml-[16px] mb-[16px];
  }
}
</style>
