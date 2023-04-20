<template>
  <div class="flex text-sm p-4 align-center">
    <div class="mr-2 pt-[2px]">
      <IconWarningCircle
        stroke-color="gray-500"
        fill-color="gray-50"
      />
    </div>
    <div class="text-gray-700">
      {{ t('debugPage.foundMoreThan100Runs') }}
      <ExternalLink
        v-if="cloudProjectUrlWithUtmParams"
        :href="cloudProjectUrlWithUtmParams"
      >
        {{ t('debugPage.goToCypressCloud') }}
      </ExternalLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
import { IconWarningCircle } from '@cypress-design/vue-icon'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

const { t } = useI18n()

const props = defineProps<{ cloudProjectUrl?: string }>()

const cloudProjectUrlWithUtmParams = props.cloudProjectUrl && getUrlWithParams({ url: props.cloudProjectUrl, params: { utm_medium: 'Debug Tab', utm_campaign: 'Run Navigation Limit' } })

</script>
