<template>
  <Tabs
    :key="key"
    :tabs="tabs"
    data-cy="testing-type-switch"
    class="testing-type-switcher"
    @switch="handleSwitch"
  />
</template>

<script setup lang="ts">

import { computed, h, FunctionalComponent } from 'vue'
import Tabs from '@cypress-design/vue-tabs'
import type { Tab } from '@cypress-design/constants-tabs'
import { IconTestingTypeComponent, IconTestingTypeE2E, IconActionQuestionMarkOutline } from '@cypress-design/vue-icon'
import { useI18n } from '@cy/i18n'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()

const props = defineProps<{
  viewedTestingType: 'e2e' | 'component' | null
  isE2eConfigured?: boolean | null
  isCtConfigured?: boolean | null
}>()

const emits = defineEmits<{
  (event: 'selectTestingType', value: 'e2e' | 'component'): void
}>()

const { t } = useI18n()

const shouldUseLongText = computed(() => width.value > 1140)

const StyledQuestionMarkIcon: FunctionalComponent = (props, ...args) => {
  return h(IconActionQuestionMarkOutline as any, { ...props, 'data-cy': 'unconfigured-icon' }, ...args)
}

// Force Vue to destroy and rebuild the `Tabs` instance when configuration states change
// Not doing this results in layout issues as icons get added/removed
const key = computed(() => `${props.isE2eConfigured}-${props.isCtConfigured}-${shouldUseLongText.value}`)

const tabs = computed(() => {
  return [
    {
      id: 'e2e',
      iconBefore: IconTestingTypeE2E,
      label: shouldUseLongText.value ? t('specPage.e2eSpecsHeader') : t('specPage.e2eSpecsHeaderShort'),
      iconAfter: props.isE2eConfigured === false ? StyledQuestionMarkIcon : undefined,
      active: props.viewedTestingType === 'e2e',
    },
    {
      id: 'component',
      iconBefore: IconTestingTypeComponent,
      label: shouldUseLongText.value ? t('specPage.componentSpecsHeader') : t('specPage.componentSpecsHeaderShort'),
      iconAfter: props.isCtConfigured === false ? StyledQuestionMarkIcon : undefined,
      active: props.viewedTestingType === 'component',
    },
  ]
})

function handleSwitch (tab: Tab) {
  emits('selectTestingType', tab.id as 'e2e' | 'component')
}

</script>

<style lang="scss">
.testing-type-switcher {
  button[role="tab"] {
    z-index: 2;
  }
  div {
    &:first-of-type {
      z-index: 1;
    }
    &:last-of-type {
      z-index: 3;
    }
  }
}
</style>
