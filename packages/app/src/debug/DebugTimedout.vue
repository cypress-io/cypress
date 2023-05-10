<template>
  <Alert
    :title="t('debugPage.incomplete')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    {{ t('debugPage.theRunStartedButNeverCompleted') }}
    <span v-if="ci && hasCiInfo">
      <i18n-t
        scope="global"
        keypath="debugPage.checkYourCiLogs"
      >
        <ExternalLink :href="ci.url || '#'">
          {{ `${ci.formattedProvider} #${ci.ciBuildNumberFormatted}` }}
        </ExternalLink>
      </i18n-t>
    </span>
    {{ t('debugPage.archiveThisRun') }}
    <div class="mt-[20px]">
      {{ t('debugPage.specsSkipped', {n: totalSpecs, totalSkippedSpecs}) }}
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { DebugPageDetails_CloudCiBuildInfoFragment } from '../generated/graphql'

const { t } = useI18n()

const props = defineProps<{
  ci?: DebugPageDetails_CloudCiBuildInfoFragment
  totalSpecs: number
  totalSkippedSpecs: number
}>()

const hasCiInfo = computed(() => {
  return !!(props.ci?.url && props.ci.formattedProvider && props.ci.ciBuildNumberFormatted)
})

</script>
