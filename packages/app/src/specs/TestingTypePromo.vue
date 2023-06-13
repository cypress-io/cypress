<template>
  <div class="flex">
    <Promo
      :campaign="campaign"
      medium="Not set up"
      :instance-id="promoInstanceId"
      class="m-auto mt-[32px]"
    >
      <template #header>
        <PromoHeader :title="t(testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.header.title' : 'specPage.testingTypePromo.ct.header.title')">
          <template #description>
            <i18n-t
              tag="p"
              :keypath="testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.header.description' : 'specPage.testingTypePromo.ct.header.description'"
            >
              <ExternalLink
                data-cy="testing-type-promo-guide-link"
                :href="guideLink"
                @click="recordEvent(testingType, 'guide')"
              >
                {{ t(testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.header.link' : 'specPage.testingTypePromo.ct.header.link') }}
              </ExternalLink>
            </i18n-t>
          </template>
          <template #control>
            <Button
              class="gap-[8px]"
              data-cy="testing-type-setup-button"
              @click="activateTestingType(testingType)"
            >
              <component :is="testingType === 'component' ? IconTestingTypeComponent : IconTestingTypeE2E" />
              <div class="border-indigo-600 border-l-[1px] -my-[8px] py-[8px] pl-[16px] ml-[8px]">
                {{ t(testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.header.control' : 'specPage.testingTypePromo.ct.header.control') }}
              </div>
              <IconChevronRightSmall />
            </Button>
          </template>
        </PromoHeader>
      </template>

      <template #cards>
        <PromoCard
          :title="t(testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.body.title' : 'specPage.testingTypePromo.ct.body.title')"
          :body="t(testingType === 'e2e' ? 'specPage.testingTypePromo.e2e.body.description' : 'specPage.testingTypePromo.ct.body.description')"
          class=""
        >
          <template #content>
            <div class="gap-[24px]">
              <ol class="py-[16px] px-[20px] gap-[16px] flex flex-col font-normal text-gray-700">
                <i18n-t
                  v-if="testingType === 'e2e'"
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.e2e.body.listItem1"
                >
                  <code class="text-jade-400">{{ t('specPage.testingTypePromo.e2e.body.listItem1Command') }}</code>
                </i18n-t>
                <i18n-t
                  v-else
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.ct.body.listItem1"
                >
                  <code class="text-jade-400">{{ t('specPage.testingTypePromo.ct.body.listItem1Command') }}</code>
                </i18n-t>

                <i18n-t
                  v-if="testingType === 'e2e'"
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.e2e.body.listItem2"
                >
                  <code class="text-jade-400">{{ t('specPage.testingTypePromo.e2e.body.listItem2Command') }}</code>
                </i18n-t>
                <i18n-t
                  v-else
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.ct.body.listItem2"
                />

                <i18n-t
                  v-if="testingType === 'e2e'"
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.e2e.body.listItem3"
                >
                  <code class="text-jade-400">{{ t('specPage.testingTypePromo.e2e.body.listItem3Command') }}</code>
                </i18n-t>
                <i18n-t
                  v-else
                  tag="li"
                  class="list-disc"
                  keypath="specPage.testingTypePromo.ct.body.listItem3"
                >
                  <span>
                    <component
                      :is="FrameworkBundlerLogos.angular"
                      class="h-[16px] w-[16px] inline"
                    />
                    <ExternalLink
                      data-cy="testing-type-promo-framework-link"
                      :href="getFrameworkLink('Angular')"
                      @click="recordEvent('component', 'framework', 'Angular')"
                    >
                      Angular
                    </ExternalLink>
                  </span>
                  <span>
                    <component
                      :is="FrameworkBundlerLogos.react"
                      class="h-[16px] w-[16px] inline"
                    />
                    <ExternalLink
                      data-cy="testing-type-promo-framework-link"
                      :href="getFrameworkLink('React')"
                      @click="recordEvent('component', 'framework', 'React')"
                    >
                      React
                    </ExternalLink>
                  </span>
                  <span>
                    <component
                      :is="FrameworkBundlerLogos.vue3"
                      class="h-[16px] w-[16px] inline"
                    />
                    <ExternalLink
                      data-cy="testing-type-promo-framework-link"
                      :href="getFrameworkLink('Vue')"
                      @click="recordEvent('component', 'framework', 'Vue')"
                    >
                      Vue
                    </ExternalLink>
                  </span>
                  <ExternalLink
                    data-cy="testing-type-promo-framework-link"
                    :href="getFrameworkLink('more')"
                    @click="recordEvent('component', 'framework', 'more')"
                  >
                    {{ t('specPage.testingTypePromo.ct.body.listItem3Link') }}
                  </ExternalLink>
                </i18n-t>
              </ol>
              <div
                v-if="testingType === 'component'"
                class="border-gray-50 border-t-[1px] pt-[16px]"
              >
                <ExternalLink
                  data-cy="testing-type-promo-feedback-link"
                  :href="giveFeedbackLink"
                  @click="recordEvent(testingType, 'feedback')"
                >
                  {{ t('specPage.testingTypePromo.ct.body.link') }}
                </ExternalLink>
              </div>
            </div>
          </template>
        </PromoCard>
      </template>
    </Promo>
  </div>
</template>

<script lang="ts" setup>

import Promo from '../components/promo/Promo.vue'
import PromoCard from '../components/promo/PromoCard.vue'
import PromoHeader from '../components/promo/PromoHeader.vue'
import Button from '@cypress-design/vue-button'
import { useI18n } from '@cy/i18n'
import { computed } from 'vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { IconTestingTypeE2E, IconTestingTypeComponent, IconChevronRightSmall } from '@cypress-design/vue-icon'
import { gql, useMutation } from '@urql/vue'
import { TestingTypePromo_RecordEventDocument } from '../generated/graphql'
import { nanoid } from 'nanoid'
import { FrameworkBundlerLogos } from '@packages/frontend-shared/src/utils/icons'

gql`
mutation TestingTypePromo_RecordEvent($campaign: String!, $medium: String!, $messageId: String!) {
  recordEvent(includeMachineId: true, campaign: $campaign, medium: $medium, messageId: $messageId)
}
`

const props = defineProps<{
  testingType: 'e2e' | 'component' | null
}>()

const emits = defineEmits<{
  (event: 'activateTestingType', value: 'e2e' | 'component'): void
}>()

const CT_MEDIUM = 'CT Preview'
const E2E_MEDIUM = 'E2E Preview'

const { t } = useI18n()
const recordEventMutation = useMutation(TestingTypePromo_RecordEventDocument)

const promoInstanceId = nanoid()

const campaign = computed(() => {
  return props.testingType === 'e2e' ? 'Specs Switcher E2E' : 'Specs Switcher Component'
})

const giveFeedbackLink = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/component-survey-q2-23',
    params: {
      utm_campaign: 'Give feedback',
      utm_medium: CT_MEDIUM,
    },
  })
})

const guideLink = computed(() => {
  if (props.testingType === 'e2e') {
    return getUrlWithParams({
      url: 'https://on.cypress.io/writing-first-test',
      params: {
        utm_campaign: 'Read our guide',
        utm_medium: E2E_MEDIUM,
      },
    })
  }

  return getUrlWithParams({
    url: 'https://on.cypress.io/component',
    params: {
      utm_campaign: 'Read our guide',
      utm_medium: CT_MEDIUM,
    },
  })
})

function getFrameworkLink (framework: string): string {
  let url: string

  switch (framework) {
    case 'Angular':
      url = 'https://on.cypress.io/angular'
      break
    case 'React':
      url = 'https://on.cypress.io/react'
      break
    case 'Vue':
      url = 'https://on.cypress.io/vue'
      break
    default:
      url = 'https://on.cypress.io/frameworks'
      break
  }

  return getUrlWithParams({
    url,
    params: {
      utm_campaign: framework,
      utm_medium: CT_MEDIUM,
    },
  })
}

function recordEvent (testingType: 'e2e' | 'component' | null, link: 'guide' | 'feedback' | 'activate' | 'framework', framework?: string) {
  let campaign: string

  if (link === 'guide') {
    campaign = 'Read our guide'
  } else if (link === 'feedback') {
    campaign = 'Give feedback'
  } else if (link === 'activate') {
    campaign = 'Quick setup'
  } else if (link === 'framework') {
    campaign = framework || 'N/A'
  } else {
    campaign = 'N/A'
  }

  const medium = testingType === 'e2e' ? E2E_MEDIUM : CT_MEDIUM

  recordEventMutation.executeMutation({
    messageId: promoInstanceId,
    campaign,
    medium,
  })
}

function activateTestingType (testingType: 'e2e' | 'component' | null): void {
  if (!testingType) {
    throw new Error('No testing type provided')
  }

  recordEvent(testingType, 'activate')

  emits('activateTestingType', testingType)
}

</script>
