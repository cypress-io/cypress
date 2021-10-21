<template>
  <div>
    <Button
      size="md"
      variant="tertiary"
      @click="copyToClipboard"
    >
      <template #prefix>
        <i-cy-copy-clipboard_x16 class="icon-dark-indigo-500 w-16px h-16px" />
      </template>
      <TransitionQuickFade mode="out-in">
        <span v-if="!showCopied">{{ t('clipboard.copy') }}</span>
        <span v-else>{{ t('clipboard.copied') }}!</span>
      </TransitionQuickFade>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '../components/Button.vue'
import TransitionQuickFade from '../components/transitions/TransitionQuickFade.vue'

const props = defineProps<{
  text: string
}>()

const showCopied = ref(false)
const { copy } = useClipboard()
const copyToClipboard = () => {
  if (props.text) {
    copy(props.text)
    showCopied.value = true
  }

  setTimeout(() => {
    showCopied.value = false
  }, 2000)
}
const { t } = useI18n()
</script>
