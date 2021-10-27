<template>
  <div>
    <Button
      size="md"
      :variant="variant"
      @click="copyToClipboard"
    >
      <template #prefix>
        <i-cy-copy-clipboard_x16
          class="w-16px h-16px"
          :class="variant === 'outline' ? 'icon-dark-gray-500' : 'icon-dark-indigo-500'"
        />
      </template>
      <TransitionQuickFade mode="out-in">
        <span v-if="!copied">{{ t('clipboard.copy') }}</span>
        <span v-else>{{ t('clipboard.copied') }}!</span>
      </TransitionQuickFade>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '../components/Button.vue'
import TransitionQuickFade from '../components/transitions/TransitionQuickFade.vue'

const props = withDefaults(defineProps<{
  text: string,
  variant?: 'tertiary' | 'outline'
}>(), {
  variant: 'tertiary',
})

const { copy, copied } = useClipboard({ copiedDuring: 2000 })
const copyToClipboard = () => {
  if (props.text) {
    copy(props.text)
  }
}
const { t } = useI18n()
</script>
