<template>
  <div class="flex flex-col mx-auto my-[45px] max-w-[680px] items-center">
    <div class="flex flex-col items-center justify-evenly">
      <component
        :is="icon"
        v-if="icon"
        class="icon-dark-gray-500 icon-light-indigo-100"
      />
      <div v-else>
        <i-cy-box-open_x48 class="icon-dark-gray-500 icon-light-indigo-100" />
      </div>
      <div class="flex flex-col gap-1 my-6 max-w-[640px] items-center">
        <div
          data-cy="debug-empty-title"
          class="font-medium text-center text-gray-900 text-lg"
        >
          {{ title }}
        </div>
        <div
          data-cy="debug-empty-description"
          class="font-normal text-center leading-relaxed text-gray-600"
        >
          {{ description }}
          <span
            v-if="helpLinkHref"
            class="ml-[4px]"
          >
            <ExternalLink
              :href="helpLink"
            >
              {{ t('links.learnMoreButton') }}
              <span class="sr-only">
                {{ helpLinkSrText }}
              </span>
            </ExternalLink>
          </span>
        </div>
      </div>
      <slot
        name="cta"
        :utm-content="cohort"
      />
    </div>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'

import { DEBUG_TAB_MEDIUM } from '../utils/constants'
import type { FunctionalComponent, SVGAttributes } from 'vue'

const { t } = useI18n()

const props = defineProps<{
  title: string
  description?: string
  icon?: FunctionalComponent<SVGAttributes, {}>
  helpLinkHref?: string
  helpLinkSrText?: string
  utm?: { utm_campaign: string }
  cohort?: string
}>()

const helpLink = getUrlWithParams({
  url: props.helpLinkHref || '',
  params: {
    utm_source: getUtmSource(),
    utm_medium: DEBUG_TAB_MEDIUM,
    utm_campaign: props.utm?.utm_campaign || 'Learn More',
  },
})

</script>

<style>
.debug-empty-view-info-button-override {
  background-color: white;
}
</style>
