<template>
  <Alert
    v-if="showSpecNotFound"
    v-model="showSpecNotFound"
    status="error"
    :title="t('specPage.noSpecError.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ t('specPage.noSpecError.intro') }} <InlineCodeFragment variant="error">
        {{ route.params.unrunnable }}
      </InlineCodeFragment>
    </p>
    <p>{{ t('specPage.noSpecError.explainer') }}</p>
  </Alert>
  <Alert
    v-if="showOffline"
    v-model="showOffline"
    data-cy="offline-alert"
    status="warning"
    :title="t('specPage.offlineWarning.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ t('specPage.offlineWarning.explainer') }}
    </p>
  </Alert>
  <Alert
    v-if="showFetchError"
    v-model="showFetchError"
    status="warning"
    :title="t('specPage.fetchFailedWarning.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p>
      {{ t('specPage.fetchFailedWarning.explainer1') }}
    </p>
    <p>
      <i18n-t
        scope="global"
        keypath="specPage.fetchFailedWarning.explainer2"
      >
        <ExternalLink
          href="https://www.cypressstatus.com"
          class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
        >
          Status Page
        </ExternalLink>
      </i18n-t>
    </p>
    <Button
      :prefix-icon="RefreshIcon"
      class="mt-24px"
      data-cy="refresh-button"
      @click="emit('refetchFailedCloudData')"
    >
      {{ t('specPage.fetchFailedWarning.refreshButton') }}
    </Button>
  </Alert>
  <Alert
    v-if="showProjectNotFound"
    v-model="showProjectNotFound"
    data-cy="project-not-found-alert"
    status="warning"
    :title="t('runs.errors.notFound.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      <i18n-t
        scope="global"
        keypath="runs.errors.notFound.description"
      >
        <CodeTag
          bg
          class="bg-purple-50 text-purple-500"
        >
          projectId: "{{ props.gql.currentProject.projectId }}"
        </CodeTag>
      </i18n-t>
    </p>
    <Button
      :prefix-icon="ConnectIcon"
      class="mt-24px"
      data-cy="reconnect-button"
      @click="emit('reconnectProject')"
    >
      {{ t('runs.errors.notFound.button') }}
    </Button>
  </Alert>
  <Alert
    v-if="showProjectRequestAccess"
    v-model="showProjectRequestAccess"
    data-cy="project-request-access-alert"
    status="info"
    :title="t('runs.errors.unauthorized.title')"
    class="mb-16px"
    :icon="WarningIcon"
    dismissible
  >
    <p class="mb-24px">
      {{ t('runs.errors.unauthorized.description') }}
    </p>
    <RequestAccessButton :gql="props.gql" />
  </Alert>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import CodeTag from '@packages/frontend-shared/src/components/CodeTag.vue'
import InlineCodeFragment from '@packages/frontend-shared/src/components/InlineCodeFragment.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import WarningIcon from '~icons/cy/warning_x16.svg'
import RefreshIcon from '~icons/cy/action-restart_x16'
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'
import RequestAccessButton from './RequestAccessButton.vue'
import { gql } from '@urql/vue'
import type { SpecsListBannersFragment } from '../generated/graphql'

const route = useRoute()
const { t } = useI18n()

gql`
fragment SpecsListBanners on Query {
  ...RequestAccessButton
}
`

const props = withDefaults(defineProps<{
  gql: SpecsListBannersFragment
  hasRequestedAccess?: boolean
  isSpecNotFound?: boolean
  isOffline?: boolean
  isFetchError?: boolean
  isProjectNotFound?: boolean
  isProjectUnauthorized?: boolean
}>(), {
  isSpecNotFound: undefined,
  isOffline: undefined,
  isFetchError: undefined,
  isProjectNotFound: undefined,
  isProjectUnauthorized: undefined,
})

const emit = defineEmits<{
  (e: 'refetchFailedCloudData'): void
  (e: 'reconnectProject'): void
}>()

const showSpecNotFound = ref(props.isSpecNotFound)
const showOffline = ref(props.isOffline)
const showFetchError = ref(props.isFetchError)
const showProjectNotFound = ref(props.isProjectNotFound)
const showProjectRequestAccess = ref(props.isProjectUnauthorized)

watch(
  () => ([props.isSpecNotFound, props.isOffline, props.isFetchError, props.isProjectNotFound, props.isProjectUnauthorized]),
  () => {
    showSpecNotFound.value = props.isSpecNotFound
    showOffline.value = props.isOffline
    showFetchError.value = props.isFetchError
    showProjectNotFound.value = props.isProjectNotFound
    showProjectRequestAccess.value = props.isProjectUnauthorized
  },
)

</script>
