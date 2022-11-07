<template>
  <div class="bg-no-repeat bg-cover h-screen min-h-700px lp-wrapper">
    <div
      ref="wrapper"
      class="rounded mx-auto bg-gray-50/50 border-color-[rgba(0,0,0,0.05)] border-4px max-w-80vw top-7vh w-716px relative overflow-hidden"
    >
      <div
        ref="scroller"
        class="bg-white rounded-b max-h-72vh pb-90px overflow-scroll"
      >
        <div class="h-full">
          <div class="p-16px">
            <h1 class="font-medium mt-4px text-center mb-32px tracking-tighter text-22px text-gray-1000">
              {{ t('majorVersionWelcome.title') }}
            </h1>
            <div class="mb-16px">
              <ExternalLink
                href="https://on.cypress.io/changelog#11-0-0"
                class="font-bold text-indigo-500"
              >
                11.0.0
              </ExternalLink>
              <span class="font-light pl-10px text-gray-500 text-14px">
                Released {{ versionReleaseDates['11'] }}
              </span>
            </div>
            <div class="children:mb-16px">
              <h2 class="font-bold text-18px text-jade-1000">
                Component Testing Released
              </h2>

              <p>
                Component Testing is now generally available for projects using React, Next.js, Angular, and Vue!
              </p>
              <p>
                Component tests allow you to see and test your application’s components in a real browser as you work. You can use your favorite Cypress commands and features to develop your components without running your whole app. <ExternalLink href="https://on.cypress.io/cypress-11-release">
                  Learn more in our blog post.
                </ExternalLink>
              </p>
              <p>
                Existing Component Testing users, see the
                <ExternalLink
                  href="https://on.cypress.io/changelog#11-0-0"
                >
                  <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                  changelog</ExternalLink>
                to learn about breaking changes.
              </p>
              <h2 class="font-bold mt-24px mb-16px text-18px text-jade-1000">
                Faster Startup Time
              </h2>

              <p>
                We have also massively improved our startup performance by shipping a snapshot of our binary instead of the source files. Results will vary based on your situation, but we saw up to 84% faster startup times!
              </p>
              <p>
                For a complete list of updates in v11, please review our <ExternalLink
                  href="https://on.cypress.io/changelog#11-0-0"
                >
                  <!--eslint-disable-next-line vue/multiline-html-element-content-newline-->
                  changelog</ExternalLink>.
              </p>
            </div>
          </div>
          <hr class="border-gray-100">
          <div class="px-16px pt-12px">
            <h2 class="font-bold mt-24px mb-12px text-14px text-gray-600">
              Previous release highlights
            </h2>
            <div class="pb-8px">
              <ExternalLink
                href="https://on.cypress.io/changelog#10-0-0"
                class="font-bold text-indigo-500"
              >
                10.0.0
              </ExternalLink>
              <span class="font-light pl-10px text-gray-500 text-14px">
                Released {{ versionReleaseDates['10'] }}
              </span>
            </div>
            <p class="text-14px leading-20px">
              We've reworked the Cypress app from the ground up to modernize the interface, streamline workflows and integrate better into your overall development experience. Read about breaking changes in our
              <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
              <ExternalLink href="https://on.cypress.io/cypress-10-release">blog post</ExternalLink>.
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white flex border-t-1 border-gray-100 w-full p-16px right-0 bottom-0 left-0 justify-between items-center absolute"
        :class="{'bottom-bar-box-shadow': shouldShowShadow}"
        data-cy="major-version-welcome-footer"
      >
        <Button
          class="group"
          size="lg"
          @click="handleClick"
        >
          {{ t('majorVersionWelcome.actionContinue') }}
          <template #suffix>
            <i-cy-chevron-right_x16 class="icon-dark-white" />
          </template>
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
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
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
    '10': useTimeAgo(Date.UTC(2022, 5, 1)).value,
    '11': useTimeAgo(Date.UTC(2022, 10, 8)).value,
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
