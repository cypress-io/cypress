<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
    :show-group="VALUES[mode].header"
  >
    <button
      type="button"
      class="cursor-default flex font-medium items-center decoration-dotted underline underline-gray-300 underline-offset-4"
    >
      <span
        class="hidden lg:flex"
        data-cy="full-header-text"
      >{{ t(VALUES[mode].header) }}</span>
      <span
        class="lg:hidden"
        data-cy="short-header-text"
      >{{ t(VALUES[mode].shortHeader || VALUES[mode].header) }}</span>
      <i-cy-circle-bg-question-mark_x16 class="ml-1 icon-dark-indigo-500 icon-light-indigo-100" />
    </button>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center p-4 items-center"
        data-cy="cloud-data-tooltip-content"
      >
        <div
          :class="{'my-2': projectConnectionStatus!== 'CONNECTED'}"
          class="max-w-300px"
        >
          <i18n-t
            scope="global"
            :keypath="tooltipTextKey"
          >
            <ExternalLink
              :href="VALUES[mode].docsUrl"
              class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
            >
              {{ t(VALUES[mode].docs) }}
            </ExternalLink>
          </i18n-t>
        </div>
        <div>
          <Button
            v-if="projectConnectionStatus === 'LOGGED_OUT'"
            :prefix-icon="UserOutlineIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            data-cy="login-button"
            @click="emits('showLogin')"
          >
            {{ t('specPage.dashboardLoginButton') }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'NOT_CONNECTED'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            data-cy="connect-button"
            @click="emits('showConnectToProject')"
          >
            {{ t("specPage.connectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'NOT_FOUND'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            data-cy="reconnect-button"
            @click="emits('showConnectToProject')"
          >
            {{ t("specPage.reconnectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'UNAUTHORIZED'"
            :prefix-icon="SendIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            data-cy="request-access-button"
            @click="requestAccess"
          >
            {{ t("specPage.requestAccessButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'ACCESS_REQUESTED'"
            :prefix-icon="SendIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            data-cy="access-requested-button"
            class="bg-gray-800 border-gray-800"
            disabled
          >
            {{ t("specPage.requestSentButton") }}
          </Button>
        </div>
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import Button from '@cy/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import UserOutlineIcon from '~icons/cy/user-outline_x16.svg'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { SpecHeaderCloudDataTooltipFragment } from '../generated/graphql'
import { SpecHeaderCloudDataTooltip_RequestAccessDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed, onMounted, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
const { t } = useI18n()

type CloudDataTooltipMode = 'LATEST_RUNS' | 'AVG_DURATION'

type CouldDataTooltipModeValues = {
  header: string
  shortHeader: string
  connected: string
  notConnected: string
  noAccess: string
  docsUrl: string
  docs: string
}

const VALUES: Record<CloudDataTooltipMode, CouldDataTooltipModeValues> = {
  LATEST_RUNS: {
    header: 'specPage.latestRuns.header',
    shortHeader: 'specPage.latestRuns.headerShort',
    connected: 'specPage.latestRuns.tooltip.connected',
    notConnected: 'specPage.latestRuns.tooltip.notConnected',
    noAccess: 'specPage.latestRuns.tooltip.noAccess',
    docsUrl: getUrlWithParams({
      url: 'https://on.cypress.io/specs-latest-runs',
      params: {
        utm_medium: 'Specs Latest Runs Tooltip',
        utm_campaign: 'Latest Runs',
      },
    }),
    docs: 'specPage.latestRuns.tooltip.linkText',
  },
  AVG_DURATION: {
    header: 'specPage.averageDuration.header',
    shortHeader: 'specPage.averageDuration.headerShort',
    connected: 'specPage.averageDuration.tooltip.connected',
    notConnected: 'specPage.averageDuration.tooltip.notConnected',
    noAccess: 'specPage.averageDuration.tooltip.noAccess',
    docsUrl: getUrlWithParams({
      url: 'https://on.cypress.io/specs-average-duration',
      params: {
        utm_medium: 'Specs Average Duration Tooltip',
        utm_campaign: 'Average Duration',
      },
    }),
    docs: 'specPage.averageDuration.tooltip.linkText',
  },
}

const emits = defineEmits<{
  (eventName: 'showLogin'): void
  (eventName: 'showConnectToProject'): void
}>()

const props = defineProps<{
  gql: SpecHeaderCloudDataTooltipFragment
  mode: CloudDataTooltipMode
}>()

gql`
fragment SpecHeaderCloudDataTooltip on Query {
  currentProject {
    id
    cloudProject{
      __typename
      ... on CloudProjectUnauthorized {
        hasRequestedAccess
      }
    }
  }
  ...Auth
  ...CloudConnectModals
}
`

gql`
mutation SpecHeaderCloudDataTooltip_RequestAccess( $projectId: String! ) {
  cloudProjectRequestAccess(projectSlug: $projectId) {
    __typename
    ... on CloudProjectUnauthorized {
      message
      hasRequestedAccess
    }
  }
}
`

const hasRequestedAccess = ref(false)

onMounted(() => {
  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') {
    hasRequestedAccess.value = props.gql.currentProject.cloudProject.hasRequestedAccess ?? false
  }
})

const projectConnectionStatus = computed(() => {
  if (!props.gql.cloudViewer) return 'LOGGED_OUT'

  if (!props.gql.currentProject?.cloudProject?.__typename) return 'NOT_CONNECTED'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectNotFound') return 'NOT_FOUND'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') {
    if (hasRequestedAccess.value) {
      return 'ACCESS_REQUESTED'
    }

    return 'UNAUTHORIZED'
  }

  return 'CONNECTED'
})

const requestAccessMutation = useMutation(SpecHeaderCloudDataTooltip_RequestAccessDocument)

async function requestAccess () {
  const projectId = props.gql.currentProject?.projectId

  if (projectId) {
    const result = await requestAccessMutation.executeMutation({ projectId })

    if (result.data?.cloudProjectRequestAccess?.__typename === 'CloudProjectUnauthorized') {
      hasRequestedAccess.value = result.data.cloudProjectRequestAccess.hasRequestedAccess ?? false
    } else {
      hasRequestedAccess.value = false
    }
  }
}

const tooltipTextKey = computed(() => {
  if (projectConnectionStatus.value === 'CONNECTED') return VALUES[props.mode].connected

  if (['UNAUTHORIZED', 'ACCESS_REQUESTED'].includes(projectConnectionStatus.value)) return VALUES[props.mode].noAccess

  return VALUES[props.mode].notConnected
})

</script>
