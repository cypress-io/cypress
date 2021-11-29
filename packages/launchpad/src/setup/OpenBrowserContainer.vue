<template>
  <HeadingText
    :title="heading.title"
    :description="heading.description"
  />
  <OpenBrowser
    v-if="props.gql"
    :gql="props.gql"
  />
</template>

<script lang="ts" setup>
import WarningList from '../warning/Warning.vue'
import OpenBrowser from './OpenBrowser.vue'
import { gql } from '@urql/vue'
import HeadingText from './HeadingText.vue'
import type { OpenBrowserContainerFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue-demi'

const { t } = useI18n()

gql`
fragment OpenBrowserContainer on CurrentProject {
  id
  currentTestingType
  isLoadingPlugins
  ...OpenBrowser
}
`

const props = defineProps<{
  gql: OpenBrowserContainerFragment
}>()

const descriptionText = computed(() => {
  return props.gql.currentTestingType === 'e2e'
    ? t('setupPage.openBrowser.description.application')
    : t('setupPage.openBrowser.description.components')
})

const heading = computed(() => {
  const isLoading = props.gql.isLoadingPlugins

  return {
    title: isLoading ? t('setupPage.openBrowser.loadingTitle') : t('setupPage.openBrowser.title'),
    description: isLoading ? t('setupPage.openBrowser.loadingDescription') : descriptionText.value,
  }
})
</script>
