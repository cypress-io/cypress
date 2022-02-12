<template>
  <Button
    v-if="isSupported || copyFn"
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
      <span v-if="!copied && !onCopied">{{ t('clipboard.copy') }}</span>
      <span v-else>{{ t('clipboard.copied') }}</span>
    </TransitionQuickFade>
  </Button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import type { ButtonSizes, ButtonVariants } from '../components/Button.vue'
import Button from '../components/Button.vue'
import TransitionQuickFade from '../components/transitions/TransitionQuickFade.vue'

type CopyFn = (text: string) => void

const props = withDefaults(defineProps<{
  text: string,
  noIcon?: boolean,
  variant?: ButtonVariants,
  size?: ButtonSizes,
  copyFn?: CopyFn
}>(), {
  noIcon: false,
  variant: 'tertiary',
  size: 'md',
  copyFn: undefined,
})

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 2000 })
const onCopied = ref(false)

let timer

const copyToClipboard = () => {
  if (props.text) {
    if (props.copyFn) {
      props.copyFn?.(props.text)
      onCopied.value = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        onCopied.value = false
      }, 2000)
    } else {
      copy(props.text)
    }
  }
}
const { t } = useI18n()
</script>
