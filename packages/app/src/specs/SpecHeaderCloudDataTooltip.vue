<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
    :hide-delay="0"
  >
    <div
      class="cursor-default decoration-dotted underline underline-gray-300 underline-offset-4"
      tabindex="0"
    >
      {{ t(headerTextKeyPath) }}
    </div>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center p-4 items-center"
      >
        <div
          :class="{'m-2': projectConnectionStatus!== 'CONNECTED'}"
          class="max-w-210px"
        >
          <i18n-t
            scope="global"
            :keypath="tooltipTextKey"
          >
            <ExternalLink
              :href="props.docsUrl"
              class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
            >
              {{ t(docsTextKeyPath) }}
            </ExternalLink>
          </i18n-t>
        </div>
        <div>
          <Button
            v-if="projectConnectionStatus === 'LOGGED_OUT'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            @click="emits('showLogin')"
          >
            {{ t('topNav.login.actionLogin') }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'NOT_CONNECTED'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            @click="emits('showConnectToProject')"
          >
            {{ t("specPage.connectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'NOT_FOUND'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            @click="emits('showConnectToProject')"
          >
            {{ t("specPage.reconnectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'UNAUTHORIZED'"
            :prefix-icon="SendIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            @click="requestAccess"
          >
            {{ t("specPage.requestAccessButton") }}
          </Button>
        </div>
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { RunsErrorRenderer_RequestAccessDocument, SpecHeaderCloudDataTooltipFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import { gql, useMutation } from '@urql/vue'
const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'showLogin'): void
  (eventName: 'showConnectToProject'): void
}>()

const props = defineProps<{
  gql: SpecHeaderCloudDataTooltipFragment
  headerTextKeyPath: string
  connectedTextKeyPath: string
  notConnectedTextKeyPath: string
  noAccessTextKeyPath: string
  docsUrl: string
  docsTextKeyPath: string
}>()

gql`
fragment SpecHeaderCloudDataTooltip on Query {
  currentProject {
    id
    cloudProject{
      __typename
    }
  }
  ...Auth
  ...CloudConnectModals
}
`

const projectConnectionStatus = computed(() => {
  if (!props.gql.cloudViewer) return 'LOGGED_OUT'

  if (!props.gql.currentProject?.cloudProject?.__typename) return 'NOT_CONNECTED'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectNotFound') return 'NOT_FOUND'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') return 'UNAUTHORIZED'

  return 'CONNECTED'
})

const requestAccessMutation = useMutation(RunsErrorRenderer_RequestAccessDocument)

function requestAccess () {
  const projectId = props.gql.currentProject?.projectId

  if (projectId) {
    requestAccessMutation.executeMutation({ projectId })
  }
}

const tooltipTextKey = computed(() => {
  if (projectConnectionStatus.value === 'CONNECTED') return props.connectedTextKeyPath

  if (projectConnectionStatus.value === 'UNAUTHORIZED') return props.noAccessTextKeyPath

  return props.notConnectedTextKeyPath
})

</script>
