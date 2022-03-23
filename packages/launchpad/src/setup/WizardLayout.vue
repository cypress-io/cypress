<template>
  <div
    :class="{
      'mx-auto border-1 border-gray-100 rounded my-32px flex flex-col': !noContainer
    }"
  >
    <div class="flex-grow">
      <slot :backFn="backFn" />
    </div>

    <ButtonBar
      v-if="!noContainer"
      :next-fn="props.nextFn"
      :can-navigate-forward="canNavigateForward"
      :back-fn="backFn"
      :alt-fn="altFn"
      :next="nextLabel"
      :show-next="showNext"
      :back="backLabel"
      :alt="alt"
      :main-variant="mainButtonVariant"
      :skip="skipLabel"
      :skip-fn="skipFn"
    >
      <slot name="button-bar" />
    </ButtonBar>
  </div>
</template>

<script lang="ts" setup>
import ButtonBar from './ButtonBar.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import type { ButtonVariants } from '@cy/components/Button.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    next?: string
    back?: string
    skip?: string
    alt?: string
    showNext?: boolean
    canNavigateForward?: boolean
    noContainer?: boolean
    altFn?: (val: boolean) => void
    nextFn?: (...args: unknown[]) => any
    backFn?: (...args: unknown[]) => any
    skipFn?: (...args: unknown[]) => any
    mainButtonVariant?: ButtonVariants
  }>(), {
    next: undefined,
    showNext: true,
    back: undefined,
    skip: undefined,
    alt: undefined,
    canNavigateForward: undefined,
    noContainer: undefined,
    altFn: undefined,
    nextFn: undefined,
    backFn: undefined,
    skipFn: undefined,
    mainButtonVariant: 'primary',
  },
)

const nextLabel = computed(() => props.next || t('setupPage.step.next'))
const backLabel = computed(() => props.back || t('setupPage.step.back'))
const skipLabel = computed(() => props.back || t('setupPage.step.skip'))

</script>
