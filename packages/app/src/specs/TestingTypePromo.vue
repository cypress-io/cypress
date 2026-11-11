<template>
  <div class="flex">
    <Promo
      :campaign="campaign"
      medium="Not set up"
      :instance-id="promoInstanceId"
      class="m-auto mt-[32px]"
    >
      <template #header>
        <PromoHeader :title="testingType === 'e2e' ? 'End-to-end testing is not set up for this project' : 'Component testing is not set up for this project'">
          <template #description>
            <p>
              Try it out now, or
              <ExternalLink
                data-cy="testing-type-promo-guide-link"
                :href="guideLink"
                @click="recordEvent(testingType, 'guide')"
              >
                read our guides
              </ExternalLink>
              to learn more
            </p>
          </template>
          <template #control>
            <Button
              class="gap-[8px]"
              data-cy="testing-type-setup-button"
              @click="activateTestingType(testingType)"
            >
              <component :is="testingType === 'component' ? IconTestingTypeComponent : IconTestingTypeE2E" />
              <div class="border-indigo-600 border-l-[1px] -my-[8px] py-[8px] pl-[16px] ml-[8px]">
                Quick setup
              </div>
              <IconChevronRightSmall />
            </Button>
          </template>
        </PromoHeader>
      </template>

      <template #cards>
        <PromoCard
          :title="testingType === 'e2e' ? 'What is end-to-end testing?' : 'What is Component Testing?'"
          :body="testingType === 'e2e'
            ? 'End-to-end tests are perfect for testing your entire application from a user\'s perspective. Visit any URL and test full user journeys across pages and domains.'
            : 'Cypress Component Testing is a technique for developers to write, test, and debug components in isolation without ever leaving the browser - and without having to run your entire application.'"
          class=""
        >
          <template #content>
            <div class="gap-[24px]">
              <ol class="py-[16px] px-[20px] gap-[16px] flex flex-col font-normal text-gray-700">
                <li
                  v-if="testingType === 'e2e'"
                  class="list-disc"
                >
                  Test full user journeys across multiple pages using
                  <code class="text-jade-400">cy.visit()</code>
                  to load up a web page for your test.
                </li>
                <li
                  v-else
                  class="list-disc"
                >
                  Instead of visiting a page, use
                  <code class="text-jade-400">cy.mount()</code>
                  to render your components directly in the browser.
                </li>

                <li
                  v-if="testingType === 'e2e'"
                  class="list-disc"
                >
                  Work with live API calls or mock them with
                  <code class="text-jade-400">cy.intercept()</code>
                  to test all possible states of your app.
                </li>
                <li
                  v-else
                  class="list-disc"
                >
                  Test from a user's perspective with all the same Cypress commands that are available in end-to-end testing.
                </li>

                <li
                  v-if="testingType === 'e2e'"
                  class="list-disc"
                >
                  Use
                  <code class="text-jade-400">cy.session()</code>
                  to maintain consistent browser sessions in your tests, and work with features like cookies and local storage, all while keeping your tests properly isolated.
                </li>
                <li
                  v-else
                  class="list-disc"
                >
                  To get started, you can generate the config for
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
                  </span>,
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
                  </span>, and
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
                  (and
                  <ExternalLink
                    data-cy="testing-type-promo-framework-link"
                    :href="getFrameworkLink('more')"
                    @click="recordEvent('component', 'framework', 'more')"
                  >
                    more
                  </ExternalLink>!).
                </li>
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
                  Give feedback
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
