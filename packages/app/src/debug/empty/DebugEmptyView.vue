<template>
  <div class="flex flex-col mx-auto my-45px max-w-680px items-center">
    <div class="flex flex-col items-center justify-evenly">
      <div><i-cy-box-open_x48 class="icon-dark-gray-500 icon-light-indigo-100" /></div>
      <div class="flex flex-col mx-[20%] mt-25px mb-20px items-center">
        <div class="font-medium my-5px text-center text-gray-900 text-18px">
          {{ title }}
        </div>
        <div class="font-normal my-5px text-center leading-relaxed text-16px text-gray-600">
          {{ description }} <ExternalLink
            v-if="helpLinkText && helpLinkHref"
            :href="helpLink"
          >
            {{ helpLinkText }}
          </ExternalLink>
        </div>
      </div>
      <slot name="cta" />
    </div>
    <Slideshow
      v-if="step !== undefined && steps"
      v-model="step"
      class="my-40px w-full"
      :total-steps="steps.length"
    >
      <template #default="slotProps">
        <DebugSlide
          v-if="step < steps.length"
          v-bind="slotProps"
          :img="steps[step].img"
          :title="steps[step].title"
          :description="steps[step].description"
        />
        <div
          v-else
          class="flex flex-col w-full items-center"
          data-cy="debug-default-empty-state"
        >
          <DebugTestLoadingContainer
            width-class="w-full"
            dot-class="icon-light-gray-200"
            :rows="loadingRows"
          >
            <template #header>
              <div class="flex justify-between">
                <div class="bg-white border rounded-md flex border-gray-100 py-4px px-8px text-14px text-gray-700 gap-8px items-center">
                  <i-cy-status-failed_x12 class="h-12px w-12px" />
                  <span>-</span>
                  <div
                    v-if="exampleTestName"
                    class="border-l border-gray-100 pl-8px"
                  >
                    {{ exampleTestName }}
                  </div>
                </div>
                <!-- TODO: Make a PR to Design System for this icon -->
                <Button
                  v-if="props.slideshowCampaign"
                  variant="outline"
                  class="debug-empty-view-info-button-override"
                  :prefix-icon="TassleIcon"
                  @click="slotProps.restart"
                >
                  Info
                </Button>
              </div>
            </template>
          </DebugTestLoadingContainer>
        </div>
      </template>
    </Slideshow>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { isNumber } from 'lodash'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'
import { useCohorts } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import TassleIcon from '~icons/cy/tassle_x16.svg'

import DebugTestLoadingContainer from './DebugTestLoadingContainer.vue'
import DebugSlide from './DebugSlide.vue'
import Slideshow from '../../components/Slideshow.vue'
import { DebugSlideshowCampaigns, DEBUG_SLIDESHOW } from '../utils/constants'
import { DebugEmptyViewDocument, DebugEmptyView_SetPreferencesDocument, DebugEmptyView_RecordEventDocument } from '../../generated/graphql'

import debugGuideSkeleton1 from '../../assets/debug-guide-skeleton-1.png'
import debugGuideSkeleton2 from '../../assets/debug-guide-skeleton-2.png'
import debugGuideSkeleton3 from '../../assets/debug-guide-skeleton-3.png'
import debugGuideText1 from '../../assets/debug-guide-text-1.png'
import debugGuideText2 from '../../assets/debug-guide-text-2.png'
import debugGuideText3 from '../../assets/debug-guide-text-3.png'

gql`
fragment _DebugEmptyView on Query {
  currentProject {
    id
    savedState
  }
}
`

// The main query of Debug.vue isn't guaranteed to have loaded for these empty states
// as it is gated by having a valid runId. We have to make a separate query rather than tack
// on to the existing fragment.
gql`
query DebugEmptyView {
  ..._DebugEmptyView
}
`

gql`
mutation DebugEmptyView_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: project) {
    ..._DebugEmptyView
  }
}`

gql`
mutation DebugEmptyView_RecordEvent($campaign: String!, $messageId: String!, $medium: String!, $cohort: String) {
  recordEvent(campaign: $campaign, messageId: $messageId, medium: $medium, cohort: $cohort)
}
`

const query = useQuery({ query: DebugEmptyViewDocument })
const slideshowCompleteMutation = useMutation(DebugEmptyView_SetPreferencesDocument)
const slideshowRecordEventMutation = useMutation(DebugEmptyView_RecordEventDocument)

const { t } = useI18n()

const props = defineProps<{
  title: string
  description?: string
  exampleTestName?: string
  helpLinkText?: string
  helpLinkHref?: string
  slideshowCampaign?: DebugSlideshowCampaigns // Not all flows need to show the slideshow (Error page)
}>()

const helpLink = getUrlWithParams({
  url: props.helpLinkHref || '',
  params: {
    utm_source: getUtmSource(),
    utm_medium: 'Debug Tab',
    utm_campaign: 'Learn More',
  },
})

const loadingRows = [
  ['w-40px', 'w-[40%]'],
  ['w-40px', 'w-[50%]'],
  ['w-40px', 'w-[65%]'],
]

const step = ref<number>()
const lastStep = 3 // Treat the default state as the last slide

const cohortBuilder = useCohorts()
const selectedCohort = cohortBuilder.getCohort({
  name: DEBUG_SLIDESHOW.id,
  options: [{ cohort: 'A', value: '' }, { cohort: 'B', value: '' }],
})

const steps = computed(() => {
  if (!selectedCohort.value?.cohort) return null

  const slideshowimages = selectedCohort.value.cohort === 'A'
    ? [debugGuideSkeleton1, debugGuideSkeleton2, debugGuideSkeleton3]
    : [debugGuideText1, debugGuideText2, debugGuideText3]

  return [
    {
      img: slideshowimages[0],
      title: t('debugPage.emptyStates.slideshow.step1.title'),
      description: t('debugPage.emptyStates.slideshow.step1.description'),
    },
    {
      img: slideshowimages[1],
      title: t('debugPage.emptyStates.slideshow.step2.title'),
      description: t('debugPage.emptyStates.slideshow.step2.description'),
    },
    {
      img: slideshowimages[2],
      title: t('debugPage.emptyStates.slideshow.step3.title'),
      description: t('debugPage.emptyStates.slideshow.step3.description'),
    },
  ]
})

const savedState = computed(() => {
  return query.data.value?.currentProject?.savedState
})

watch([savedState, selectedCohort], () => {
  // If we've already set a step we can return early
  if (isNumber(step.value)) return

  // If the parent doesn't want to show the slideshow or they've already completed the slideshow, show default
  if (!props.slideshowCampaign || savedState.value.debugSlideshowComplete) {
    step.value = lastStep

    return
  }

  // These are async so we need to wait on them both to be defined
  if (selectedCohort.value && savedState.value) {
    step.value = 0
    // This is the first time the user is seeing the slideshow within this context (props.slideshowCampaign)
    slideshowRecordEventMutation.executeMutation({
      campaign: props.slideshowCampaign,
      medium: DEBUG_SLIDESHOW.medium,
      cohort: selectedCohort.value.cohort,
      messageId: DEBUG_SLIDESHOW.id,
    })
  }
})

watch(step, (newStep, oldStep) => {
  // Verify that we are transitioning from 2 -> 3 rather than undefined -> 3
  if (isNumber(oldStep) && newStep === lastStep && !savedState.value.debugSlideshowComplete) {
    slideshowCompleteMutation.executeMutation({ value: JSON.stringify({ debugSlideshowComplete: true }) })
  }
})

</script>

<style>
.debug-empty-view-info-button-override {
  background-color: white;
}
</style>
