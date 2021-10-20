<template>
  <div>
    <Button
      tabindex="1"
      size="md"
      variant="tertiary"
      @click="copyToClipboard"
    >
      <template #prefix>
        <i-cy-copy-clipboard_x16 class="icon-dark-indigo-500" />
      </template>
      <transition
        name="fade"
        mode="out-in"
      >
        <span v-if="!showCopied">{{ t('clipboard.copy') }}</span>
        <span v-else>{{ t('clipboard.copied') }}!</span>
      </transition>
    </Button>
    <textarea
      ref="textElement"
      tabindex="-1"
      :value="text"
      class="absolute -top-96"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@cy/i18n'
import Button from '../components/Button.vue'

defineProps<{
  text: string
}>()

const showCopied = ref(false)
const textElement = ref<HTMLTextAreaElement | null>(null)
const copyToClipboard = async () => {
  textElement.value?.select()
  document.execCommand('copy')
  showCopied.value = true
  setTimeout(() => {
    showCopied.value = false
  }, 2000)
}
const { t } = useI18n()
</script>

<style>
.fade-leave-active {
  transition: opacity 100ms ease;
}

.fade-leave-to {
  opacity: 0;
}
</style>
