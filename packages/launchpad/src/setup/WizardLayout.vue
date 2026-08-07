<template>
  <div class="mx-auto my-[32px]">
    <div
      v-if="$slots.accessory"
      class="w-full mb-[24px]"
    >
      <slot name="accessory" />
    </div>
    <div class="w-full border border-gray-100 rounded flex flex-col">
      <div class="grow">
        <slot :backFn="backFn" />
      </div>
      <ButtonBar
        :next-fn="props.nextFn"
        :can-navigate-forward="canNavigateForward"
        :back-fn="backFn"
        :next="nextLabel"
        :back="t('setupPage.step.back')"
        :main-variant="mainButtonVariant"
        :skip="t('setupPage.step.skip')"
        :skip-fn="skipFn"
      >
        <slot name="button-bar" />
      </ButtonBar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ButtonBar from './ButtonBar.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import type { ButtonVariants } from '@cypress-design/vue-button'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    next?: string
    canNavigateForward?: boolean
    nextFn?: (...args: unknown[]) => any
    backFn?: (...args: unknown[]) => any
    skipFn?: (...args: unknown[]) => any
    mainButtonVariant?: ButtonVariants
  }>(), {
    next: undefined,
    canNavigateForward: undefined,
    nextFn: undefined,
    backFn: undefined,
    skipFn: undefined,
    mainButtonVariant: 'indigo-dark',
  },
)

const nextLabel = computed(() => props.next || t('setupPage.step.next'))

</script>
