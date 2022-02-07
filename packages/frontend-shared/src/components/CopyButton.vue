<template>
  <Button
    v-if="isSupported"
    :size="size"
    :variant="variant"
    data-cy="copy-button"
    @click="copyToClipboard"
  >
    <template
      v-if="!noIcon"
      #prefix
    >
      <i-cy-copy-clipboard_x16
        class="h-16px w-16px"
        :class="{
          'icon-dark-indigo-500': variant === 'tertiary',
          'icon-dark-gray-500': variant === 'outline'
        }"
      />
    </template>
    <TransitionQuickFade mode="out-in">
      <span v-if="!copied">{{ t('clipboard.copy') }}</span>
      <span v-else>{{ t('clipboard.copied') }}</span>
    </TransitionQuickFade>
  </Button>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button, { ButtonSizes, ButtonVariants } from '../components/Button.vue'
import TransitionQuickFade from '../components/transitions/TransitionQuickFade.vue'

const props = withDefaults(defineProps<{
  text: string,
  noIcon?: boolean,
  variant?: ButtonVariants,
  size?: ButtonSizes,
}>(), {
  noIcon: false,
  variant: 'tertiary',
  size: 'md',
})

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 2000 })
const copyToClipboard = () => {
  if (props.text) {
    copy(props.text)
  }
}
const { t } = useI18n()
</script>
