<template>
  <div class="h-full ">
    <NoInternetConnection v-if="!online">
      {{ t('launchpadErrors.noInternet.connectProject') }}
    </NoInternetConnection>
    <RunsConnectSuccessAlert
      v-if="currentProject && showConnectSuccessAlert"
      :gql="currentProject"
      :class="{ 'absolute left-[24px] right-[24px] top-[24px]': currentProject?.cloudProject?.__typename === 'CloudProject' && !runs?.length }"
    />
    <RunsConnect
      v-if="!userProjectStatusStore.user.isLoggedIn || !currentProject?.projectId"
      :campaign="!userProjectStatusStore.user.isLoggedIn ? RUNS_PROMO_CAMPAIGNS.login : RUNS_PROMO_CAMPAIGNS.connectProject"
    />
    <RunsErrorRenderer
      v-else-if="currentProject?.cloudProject?.__typename !== 'CloudProject' || connectionFailed"
      :gql="props.gql"
      @re-execute-runs-query="emit('reExecuteRunsQuery')"
    />
    <RunsEmpty
      v-else-if="!runs?.length"
    />
    <div
      v-else
      data-cy="runs"
      class="flex flex-col pb-[24px] gap-[16px]"
    >
      <Warning
        v-if="!online"
        :title="t('launchpadErrors.noInternet.header')"
        :message="t('launchpadErrors.noInternet.message')"
        :dismissible="false"
        class="mx-auto mb-[24px]"
      />
      <RunCard
        v-for="run of runs"
        :key="run.id"
        :gql="run"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@cy/i18n'
import NoInternetConnection from '@packages/frontend-shared/src/components/NoInternetConnection.vue'
import RunCard from './RunCard.vue'
import RunsConnect from './RunsConnect.vue'
import RunsConnectSuccessAlert from './RunsConnectSuccessAlert.vue'
import RunsEmpty from './RunsEmpty.vue'
import Warning from '@packages/frontend-shared/src/warning/Warning.vue'
import RunsErrorRenderer from './RunsErrorRenderer.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { RUNS_PROMO_CAMPAIGNS } from './utils/constants'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'reExecuteRunsQuery'): void
}>()

const currentProject = computed(() => props.gql.currentProject)

const props = defineProps<{
  gql: RunsContainerFragment
  runs?: readonly RunCardFragment[]
  online: boolean
}>()

const showConnectSuccessAlert = ref(false)
const connectionFailed = computed(() => !props.gql.currentProject?.cloudProject && props.online)

const userProjectStatusStore = useUserProjectStatusStore()

watch(() => userProjectStatusStore.project.isProjectConnected, (newVal, oldVal) => {
  if (newVal && oldVal === false) {
    // only show this alert if we have just connected
    showConnectSuccessAlert.value = true
  } else {
    // otherwise, set to false, eg if we just connected,
    // and then manually reverted the config changes
    // or edited the project ID
    showConnectSuccessAlert.value = false
  }
})

</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
