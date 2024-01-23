<template>
  <Button
    :size="size"
    :variant="variant"
    data-cy="copy-button"
    @click="copyToClipboard"
  >
    <IconGeneralClipboard
      v-if="!noIcon"
      class="mr-[8px]"
      :stroke-color="copyIconColor"
    />
    <TransitionQuickFade mode="out-in">
      <span v-if="!copied">{{ t('clipboard.copy') }}</span>
      <span v-else>{{ t('clipboard.copied') }}</span>
    </TransitionQuickFade>
  </Button>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import Button, { type SizeClassesTable, type VariantClassesTable } from '@cypress-design/vue-button'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import { useClipboard } from './useClipboard'
import { IconGeneralClipboard } from '@cypress-design/vue-icon'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  noIcon?: boolean
  variant?: keyof typeof VariantClassesTable
  size?: keyof typeof SizeClassesTable
}>(), {
  noIcon: false,
  variant: 'indigo-light',
  size: '32',
})

const copyIconColor = computed(() => {
  /**
   * <wind-keep stroke-color="indigo-500" stroke-color="gray-500" />
   */
  return props.variant === 'indigo-light'
    ? 'indigo-500' :
    props.variant === 'outline-light'
      ? 'gray-500' : undefined
})

const { copy, copied } = useClipboard({ copiedDuring: 2000 })
const copyToClipboard = () => {
  if (props.text) {
    copy(props.text)
  }
}
const { t } = useI18n()
</script>
