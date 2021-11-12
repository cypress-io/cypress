<template>
  <Warning
    v-if="query.data.value?.currentProject?.browserErrorMessage"
    title="Browser Error"
    :message="query.data.value?.currentProject?.browserErrorMessage"
  />
  <HeadingText
    :title="t('setupPage.openBrowser.title')"
    :description="t('setupPage.openBrowser.description')"
  />
  <OpenBrowser
    v-if="query.data.value?.currentProject"
    :gql="query.data.value.currentProject"
  />
</template>

<script lang="ts" setup>
import Warning from '../error/Warning.vue'
import OpenBrowser from './OpenBrowser.vue'
import { gql, useQuery } from '@urql/vue'
import HeadingText from './HeadingText.vue'
import { OpenBrowserContainerDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
query OpenBrowserContainer {
  currentProject {
    id
    browserErrorMessage
    ...OpenBrowser
  }
  wizard {
    ...Wizard
  }
}
`

const query = useQuery({ query: OpenBrowserContainerDocument })
</script>
