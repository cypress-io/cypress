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
        v-if="userProjectStatusStore.cloudStatusMatches('needsRecordedRun') && userProjectStatusStore.project.isUsingGit"
        :title="t('runs.empty.noRunsFoundForBranch')"
        :message="noRunsForBranchMessage"
      />
      <Warning
        v-if="!online"
        :title="t('launchpadErrors.noInternet.header')"
        :message="t('launchpadErrors.noInternet.message')"
        :dismissible="false"
        class="mx-auto mb-[24px]"
      />
      <Warning
        v-if="!userProjectStatusStore.project.isUsingGit"
        :title="t('runs.empty.gitRepositoryNotDetected')"
        :message="t('runs.empty.ensureGitSetupCorrectly')"
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
import { RUNS_PROMO_CAMPAIGNS, RUNS_TAB_MEDIUM } from './utils/constants'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'

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

const noRunsForBranchMessage = computed(() => {
  const learnMoreLink = getUrlWithParams({
    url: 'https://on.cypress.io/git-info',
    params: {
      utm_source: getUtmSource(),
      utm_medium: RUNS_TAB_MEDIUM,
      utm_campaign: 'No Runs Found',
    },
  })

  const message = t('runs.empty.noRunsForBranchMessage')
  const link = `[${t('links.learnMoreButton')}](${learnMoreLink})`

  return `${message} ${link}`
})

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
