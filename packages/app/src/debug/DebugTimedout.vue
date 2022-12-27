<template>
  <Alert
    :title="t('debugPage.incomplete')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-24px w-full"
  >
    {{ t('debugPage.theRunStartedButNeverCompleted') }}
    <span v-if="ci && ci.url && ci.formattedProvider && ci.ciBuildNumberFormatted">
      <i18n-t
        scope="global"
        keypath="debugPage.checkYourCiLogs"
      >
        <a
          class="text-indigo-500"
          :href="ci.url || '#'"
        >{{ `${ci.formattedProvider} #${ci.ciBuildNumberFormatted}` }}</a>
      </i18n-t>
    </span>

    <div class="mt-20px">
      {{ t('debugPage.specsSkipped', {n: totalSpecs, totalSkippedSpecs}) }}
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import { useI18n } from '@cy/i18n'
import type { CloudCiBuildInfo } from '@packages/data-context/src/gen/graphcache-config.gen'

const { t } = useI18n()

defineProps<{
  ci?: Partial<CloudCiBuildInfo>
  totalSpecs: number
  totalSkippedSpecs: number
}>()

</script>
