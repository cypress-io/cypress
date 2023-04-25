<template>
  <div class="flex flex-col mx-auto my-45px max-w-680px items-center">
    <div class="flex flex-col items-center justify-evenly">
      <div><i-cy-box-open_x48 class="icon-dark-gray-500 icon-light-indigo-100" /></div>
      <div class="flex flex-col mt-25px mb-20px max-w-640px items-center">
        <div class="font-medium my-5px text-center text-gray-900 text-18px">
          {{ title }}
        </div>
        <div class="font-normal my-5px text-center leading-relaxed text-16px text-gray-600">
          {{ description }}
          <span
            v-if="helpLinkHref"
            class="ml-4px"
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
        :utm-content="selectedCohort?.cohort"
      />
    </div>
    <Slideshow
      v-if="step !== undefined && steps"
      v-model="step"
      :steps="steps"
      class="my-40px w-full"
      @slideshow-complete="saveSlideshowComplete"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { isNumber } from 'lodash'
import { nanoid } from 'nanoid'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import { useI18n } from '@packages/frontend-shared/src/locales/i18n'
import { useCohorts } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'

import DebugSlide from './DebugSlide.vue'
import Slideshow, { SlideshowStep } from '../../components/Slideshow.vue'
import { DebugSlideshowCampaigns, DEBUG_SLIDESHOW, DEBUG_TAB_MEDIUM } from '../utils/constants'
import { DebugEmptyViewDocument, DebugEmptyView_SetPreferencesDocument, DebugEmptyView_RecordEventDocument } from '../../generated/graphql'
import DebugSkeleton from './DebugSkeleton.vue'

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
  helpLinkHref?: string
  helpLinkSrText?: string
  slideshowCampaign?: DebugSlideshowCampaigns // Not all flows need to show the slideshow (Error page)
}>()

const helpLink = getUrlWithParams({
  url: props.helpLinkHref || '',
  params: {
    utm_source: getUtmSource(),
    utm_medium: DEBUG_TAB_MEDIUM,
    utm_campaign: 'Learn More',
  },
})

const step = ref<number>()

const cohortBuilder = useCohorts()
const selectedCohort = cohortBuilder.getCohort({
  name: DEBUG_SLIDESHOW.id,
  options: [{ cohort: 'A', value: '' }, { cohort: 'B', value: '' }],
})

const steps = computed<SlideshowStep[] | undefined>(() => {
  if (!selectedCohort.value?.cohort) return undefined

  const slideshowImages = selectedCohort.value.cohort === 'A'
    ? [debugGuideSkeleton1, debugGuideSkeleton2, debugGuideSkeleton3]
    : [debugGuideText1, debugGuideText2, debugGuideText3]

  return [
    {
      component: DebugSkeleton,
      props: {
        exampleTestName: props.exampleTestName,
        slideshowCampaign: props.slideshowCampaign,
      },
    },
    {
      component: DebugSlide,
      props: {
        img: slideshowImages[0],
        title: t('debugPage.emptyStates.slideshow.step1.title'),
        description: t('debugPage.emptyStates.slideshow.step1.description'),
      },
    },
    {
      component: DebugSlide,
      props: {
        img: slideshowImages[1],
        title: t('debugPage.emptyStates.slideshow.step2.title'),
        description: t('debugPage.emptyStates.slideshow.step2.description'),
      },
    },
    {
      component: DebugSlide,
      props: {
        img: slideshowImages[2],
        title: t('debugPage.emptyStates.slideshow.step3.title'),
        description: t('debugPage.emptyStates.slideshow.step3.description'),
      },
    },
  ]
})

const savedState = computed(() => {
  return query.data.value?.currentProject?.savedState
})

const slideShowMessageId = nanoid()

watch([savedState, selectedCohort], () => {
  // If we've already set a step we can return early
  if (isNumber(step.value)) return

  // If the parent doesn't want to show the slideshow or they've already completed the slideshow, show default
  if (!props.slideshowCampaign || savedState.value.debugSlideshowComplete) {
    step.value = 0

    return
  }

  // These are async so we need to wait on them both to be defined
  if (selectedCohort.value && savedState.value) {
    step.value = 1
    // This is the first time the user is seeing the slideshow within this context (props.slideshowCampaign)
    slideshowRecordEventMutation.executeMutation({
      campaign: props.slideshowCampaign,
      medium: DEBUG_SLIDESHOW.medium,
      cohort: selectedCohort.value.cohort,
      messageId: slideShowMessageId,
    })
  }
})

function saveSlideshowComplete () {
  if (!savedState.value.debugSlideshowComplete) {
    slideshowCompleteMutation.executeMutation({ value: JSON.stringify({ debugSlideshowComplete: true }) })
  }
}

</script>

<style>
.debug-empty-view-info-button-override {
  background-color: white;
}
</style>
