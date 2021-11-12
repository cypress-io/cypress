<template>
  <HeadingText
    :title="title"
    :description="description"
  />
  <div
    :class="[$attrs.class, {
      'mx-auto border-1 border-gray-100 rounded my-32px flex flex-col': !noContainer
    }]"
  >
    <div class="flex-grow">
      <slot :backFn="backFn" />
    </div>

    <ButtonBar
      v-if="!noContainer"
      :next-fn="nextFn"
      :can-navigate-forward="canNavigateForward"
      :back-fn="backFn"
      :alt-fn="altFn"
      :next="nextLabel"
      :show-next="showNext"
      :back="backLabel"
      :alt="alt"
    >
      <slot name="button-bar" />
    </ButtonBar>
  </div>
</template>

<script lang="ts" setup>
import HeadingText from './HeadingText.vue'
import ButtonBar from './ButtonBar.vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import { useWizardStore } from '../store/wizardStore'

const wizardStore = useWizardStore()

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    next?: string
    back?: string
    alt?: string
    showNext?: boolean
    canNavigateForward?: boolean
    noContainer?: boolean
    altFn?: (val: boolean) => void
    backFn?: (...args: unknown[]) => any,
    nextFn?: (...args: unknown[]) => any,
  }>(), {
    next: undefined,
    showNext: true,
    back: undefined,
    alt: undefined,
    canNavigateForward: undefined,
    noContainer: undefined,
    altFn: undefined,
    nextFn: undefined,
    backFn: undefined,
  },
)

const nextLabel = computed(() => props.next || t('setupPage.step.next'))
const backLabel = computed(() => props.back || t('setupPage.step.back'))

async function nextFn () {
  await props.nextFn?.()
  wizardStore.next()
}

async function backFn () {
  await props.backFn?.()
  wizardStore.previous()
}

</script>
