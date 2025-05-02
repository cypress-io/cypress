<!--
  MajorVersionWelcome.vue

  This is the landing page that all users will see when they upgrade
  to a new major version.

  See the README of this package for details about this component.

  Internal Cypress employees: the process around managing this content
  is documented in `prod-eng-docs`. Refer to those docs when modifying
  this component or reviewing changes. Changes should go through
  a specific approval process.
 -->

<template>
  <div class="bg-no-repeat bg-cover h-screen min-h-[700px] lp-wrapper">
    <div
      ref="wrapper"
      class="rounded mx-auto bg-gray-50/50 border-[rgba(0,0,0,0.05)] border-[4px] max-w-[80vw] top-[7vh] w-[716px] relative overflow-hidden"
    >
      <div
        ref="scroller"
        class="bg-white rounded-b max-h-[72vh] pb-[90px] overflow-scroll"
      >
        <div class="h-full">
          <div
            class="p-[16px]"
            data-cy="release-highlights"
          >
            <h1 class="font-medium text-center mb-[8px] tracking-tighter text-[22px] leading-snug text-gray-1000">
              {{ t('majorVersionWelcome.title') }}
            </h1>

            <div class="mb-[16px]">
              <ExternalLink
                href="https://on.cypress.io/changelog?utm_source=Binary%3A+App&utm_medium=splash-page&utm_campaign=v14#14-0-0"
                class="font-bold text-indigo-500"
              >
                14.0.0
              </ExternalLink>
              <span class="font-light pl-[10px] text-gray-500 text-[14px]">
                Released {{ versionReleaseDates['14'] }}
              </span>
            </div>
            <div class="children:mb-[16px]">
              <p>
                We’ve improved performance of component testing and added support for new framework and dev server versions.
              </p>
              <p>
                This release also includes breaking changes to <InlineCodeFragment>cy.origin</InlineCodeFragment> that are necessary to handle
                Chrome’s deprecation of <InlineCodeFragment>document.domain</InlineCodeFragment>, which should fix issues for some users in recent Chrome versions. Support for older versions of Node.js, Linux distributions, browsers and component testing frameworks and dev servers is also removed.
              </p>
              <p>
                For a complete list of updates, please review our <ExternalLink href="https://on.cypress.io/changelog?utm_source=Binary%3A+App&utm_medium=splash-page&utm_campaign=v14#14-0-0">
                  <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                  changelog</ExternalLink>.
              </p>
            </div>
          </div>
          <hr class="border-gray-100">
          <div
            class="px-[16px] pt-[12px]"
            data-cy="previous-release-highlights"
          >
            <h2 class="font-bold mt-[24px] mb-[12px] text-[14px] text-gray-600">
              Previous release highlights
            </h2>
            <div class="pb-[8px]">
              <ExternalLink
                href="https://on.cypress.io/changelog#13-0-0"
                class="font-bold text-indigo-500"
              >
                13.0.0
              </ExternalLink>
              <span class="font-light pl-[10px] text-gray-500 text-[14px]">
                Released {{ versionReleaseDates['13'] }}
              </span>
            </div>
            <p class="text-[14px] leading-[20px]">
              We introduced <ExternalLink href="https://on.cypress.io/test-replay?utm_source=Binary%3A+App&utm_medium=splash-page&utm_campaign=v13#13-0-0">
                <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                Test Replay </ExternalLink> and made changes to default values for video configuration.
              <br>
              <br>
              Read about the v13.0.0 changes in our
              <ExternalLink href="https://on.cypress.io/cypress-13-release">
                <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                blog post</ExternalLink>.
            </p>
            <br>
            <div class="pb-[8px]">
              <ExternalLink
                href="https://on.cypress.io/changelog#12-0-0"
                class="font-bold text-indigo-500"
              >
                12.0.0
              </ExternalLink>
              <span class="font-light pl-[10px] text-gray-500 text-[14px]">
                Released {{ versionReleaseDates['12'] }}
              </span>
            </div>
            <p class="text-[14px] leading-[20px]">
              We made <ExternalLink href="https://on.cypress.io/origin">
                <InlineCodeFragment>cy.origin()</InlineCodeFragment>
              </ExternalLink>, <ExternalLink href="https://on.cypress.io/session">
                <InlineCodeFragment>cy.session()</InlineCodeFragment>
              </ExternalLink>, and test isolation generally available to allow users to test multiple origin workflows while allowing users to rehydrate test state in a consistent manner.
              <br>
              <br>
              Read about the v12.0.0 changes in our
              <ExternalLink href="https://on.cypress.io/cypress-12-release">
                <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                blog post</ExternalLink>.
            </p>
            <br>
            <div class="pb-[8px]">
              <ExternalLink
                href="https://on.cypress.io/changelog#11-0-0"
                class="font-bold text-indigo-500"
              >
                11.0.0
              </ExternalLink>
              <span class="font-light pl-[10px] text-gray-500 text-[14px]">
                Released {{ versionReleaseDates['11'] }}
              </span>
            </div>
            <p class="text-[14px] leading-[20px]">
              We made Component Testing generally available for projects using React, Next.js, Angular, and Vue which allows you to test your application's components without running your whole app! We also massively improved our startup performance with up to 84% faster startup times!
              <br>
              <br>
              Read about the v11.0.0 changes in our
              <ExternalLink href="https://on.cypress.io/cypress-11-release">
                <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                blog post</ExternalLink>.
            </p>
            <br>
            <div class="pb-[8px]">
              <ExternalLink
                href="https://on.cypress.io/changelog#10-0-0"
                class="font-bold text-indigo-500"
              >
                10.0.0
              </ExternalLink>
              <span class="font-light pl-[10px] text-gray-500 text-[14px]">
                Released {{ versionReleaseDates['10'] }}
              </span>
            </div>
            <p class="text-[14px] leading-[20px]">
              We've reworked the Cypress app from the ground up to modernize the interface, streamline workflows and integrate better into your overall development experience.
              <br>
              <br>
              Read about breaking changes in our

              <ExternalLink href="https://on.cypress.io/cypress-10-release">
                <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                blog post</ExternalLink>.
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white flex border-t border-gray-100 w-full p-[16px] right-0 bottom-0 left-0 justify-between items-center absolute"
        :class="{'bottom-bar-box-shadow': shouldShowShadow}"
        data-cy="major-version-welcome-footer"
      >
        <Button
          class="group"
          size="40"
          @click="handleClick"
        >
          {{ t('majorVersionWelcome.actionContinue') }}
          <i-cy-chevron-right_x16 class="icon-dark-white ml-[8px]" />
        </Button>
        <ExternalLink
          href="https://on.cypress.io/changelog"
        >
          {{ t('majorVersionWelcome.linkReleaseNotes') }}
        </ExternalLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cypress-design/vue-button'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import InlineCodeFragment from '@cy/components/InlineCodeFragment.vue'
import { useScroll, useElementSize, useTimeAgo } from '@vueuse/core'
import { computed, ref } from 'vue'

const { t } = useI18n()

const scroller = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)
const { arrivedState, y: scrollerY } = useScroll(scroller)
const { height: wrapperHeight } = useElementSize(wrapper)

const emit = defineEmits<{
  (eventName: 'clearLandingPage', value: void): void
}>()

const handleClick = () => {
  emit('clearLandingPage')
}

const versionReleaseDates = computed(() => {
  return {
    // Note, months are zero indexed.
    '10': useTimeAgo(Date.UTC(2022, 5, 1)).value,
    '11': useTimeAgo(Date.UTC(2022, 10, 8)).value,
    '12': useTimeAgo(Date.UTC(2022, 11, 6)).value,
    '13': useTimeAgo(Date.UTC(2023, 7, 29)).value,
    '14': useTimeAgo(Date.UTC(2025, 0, 16)).value,
  }
})

const shouldShowShadow = computed(() => {
  if (!scroller.value) {
    return false
  }

  const isScrolledToBottom = arrivedState.bottom

  const isTallEnoughToScroll = wrapperHeight.value < scroller.value.scrollHeight

  const showBecauseNotScrolledToBottom = isTallEnoughToScroll && !isScrolledToBottom
  const showBecauseHaveNotScrolledYet = isTallEnoughToScroll && scrollerY.value === 0

  return showBecauseNotScrolledToBottom || showBecauseHaveNotScrolledYet
})

</script>

<style scoped lang="scss">
.lp-wrapper {
  background-image: url("../images/Background.svg");
}

.bottom-bar-box-shadow {
  box-shadow: 0 -7px 11px -10px rgb(0 0 0 / 26%)
}
</style>
