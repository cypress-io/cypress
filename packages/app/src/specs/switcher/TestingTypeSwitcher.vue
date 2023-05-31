<template>
  <Tabs
    :tabs="tabs"
    data-cy="testing-type-switch"
    @switch="handleSwitch"
  />
</template>

<script setup lang="ts">

import { computed } from 'vue'
import Tabs from '@cypress-design/vue-tabs'
import type { Tab } from '@cypress-design/constants-tabs'
import { IconTestingTypeComponent, IconTestingTypeE2E, IconActionQuestionMarkOutline } from '@cypress-design/vue-icon'
import { useI18n } from '@cy/i18n'

const props = defineProps<{
  viewedTestingType: 'e2e' | 'component' | null
  isE2eConfigured: boolean
  isCtConfigured: boolean
}>()

const emits = defineEmits<{
  (event: 'selectTestingType', value: 'e2e' | 'component'): void
}>()

const { t } = useI18n()

const tabs = computed(() => {
  return [
    {
      id: 'e2e',
      iconBefore: IconTestingTypeE2E,
      label: t('specPage.e2eSpecsHeader'),
      iconAfter: props.isE2eConfigured ? undefined : IconActionQuestionMarkOutline,
      active: props.viewedTestingType === 'e2e',
    },
    {
      id: 'component',
      iconBefore: IconTestingTypeComponent,
      label: t('specPage.componentSpecsHeader'),
      iconAfter: props.isCtConfigured ? undefined : IconActionQuestionMarkOutline,
      active: props.viewedTestingType === 'component',
    },
  ]
})

function handleSwitch (tab: Tab) {
  emits('selectTestingType', tab.id as 'e2e' | 'component')
}

</script>
