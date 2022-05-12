<template>
  <Tooltip
    placement="top"
    :is-interactive="true"
  >
    <div class="decoration-dashed underline underline-gray-300 underline-offset-4">
      {{ headerText }}
    </div>
    <template
      #popper
    >
      <div
        class="flex flex-col text-sm text-center items-center"
      >
        <div
          :class="{'m-2': projectConnectionStatus!== 'CONNECTED'}"
          class="max-w-210px"
        >
          {{ projectConnectionStatus === 'CONNECTED' ? connectedText: notConnectedText }}
        </div>
        <div>
          <Auth
            v-if="projectConnectionStatus === 'LOGGED_OUT'"
            :gql="props.gql"
            :show-retry="false"
          />
          <Button
            v-else-if="projectConnectionStatus === 'NOT_CONNECTED'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            :disabled="false"
            @click="showConnectDialog = true"
          >
            {{ t("specPage.connectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'NOT_FOUND'"
            :prefix-icon="ConnectIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            :disabled="false"
            @click="showConnectDialog = true"
          >
            {{ t("specPage.reconnectProjectButton") }}
          </Button>
          <Button
            v-else-if="projectConnectionStatus === 'UNAUTHORIZED'"
            :prefix-icon="SendIcon"
            prefix-icon-class="icon-dark-white icon-light-transparent"
            :disabled="false"
            @click="requestAccess"
          >
            {{ t("specPage.requestAccessButton") }}
          </Button>
        </div>
      </div>
    </template>
  </Tooltip>
  <CloudConnectModals
    v-if="showConnectDialog"
    :show="showConnectDialog"
    :gql="props.gql"
    @cancel="showConnectDialog = false"
    @success="showConnectDialog = false"
  />
</template>

<script setup lang="ts">
import Auth from '@packages/frontend-shared/src/gql-components/Auth.vue'
import CloudConnectModals from '../runs/modals/CloudConnectModals.vue'
import Button from '@cy/components/Button.vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import SendIcon from '~icons/cy/paper-airplane_x16.svg'
import { RunsErrorRenderer_RequestAccessDocument, SpecHeaderCloudDataTooltipFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
const { t } = useI18n()

const props = defineProps<{
  gql: SpecHeaderCloudDataTooltipFragment
  headerText: string
  connectedText: string
  notConnectedText: string
}>()

const showConnectDialog = ref(false)

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

</script>
