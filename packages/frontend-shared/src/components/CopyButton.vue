<template>
  <div>
    <Button
      size="md"
      :variant="variant"
      @click="copyToClipboard"
    >
      <template
        v-if="!noIcon"
        #prefix
      >
        <i-cy-copy-clipboard_x16
          class="icon-dark-indigo-500 w-16px h-16px"
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
import Button, { ButtonVariants } from '../components/Button.vue'
import TransitionQuickFade from '../components/transitions/TransitionQuickFade.vue'

const props = withDefaults(defineProps<{
  text: string,
  noIcon?: boolean,
  variant?: ButtonVariants,
}>(), {
  noIcon: false,
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
