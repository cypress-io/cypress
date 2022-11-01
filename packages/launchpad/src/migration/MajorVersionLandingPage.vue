<template>
  <div class="bg-no-repeat bg-cover h-screen min-h-700px lp-wrapper">
    <div
      ref="wrapper"
      class="border-transparent rounded mx-auto bg-gray-50/50 border-4px max-w-80vw top-7vh w-716px relative overflow-hidden"
    >
      <div
        ref="scroller"
        class="bg-white rounded-b max-h-72vh p-16px pb-90px overflow-scroll"
      >
        <div class="h-full overflow-scroll">
          <h1 class="font-medium mt-4px text-center mb-32px tracking-tighter text-22px text-teal-1000">
            <i18n-t
              tag="p"
              keypath="majorVersionLandingPage.title"
              class="mb-24px"
            >
              {{ t('majorVersionLandingPage.majorVersion') }}
            </i18n-t>
          </h1>
          <div class="children:mb-16px">
            <p>
              {{ t('majorVersionLandingPage.description') }}
            </p>
            <p>
              Component tests allow you to see and test your application’s components in a real browser as you work. You can use your favorite Cypress commands and features (such as time-travel debugging) and develop your components without running your whole app. <ExternalLink href="#">
                Learn more about Cypress Component Testing.
              </ExternalLink>
            </p>
            <p>
              We have also massively improved our startup performance by shipping a snapshot of our binary instead of the source files. Results will vary based on your situation, but we saw up to 84% faster startup times!
            </p>
            <p>
              For a complete list of updates in v11, please review our <ExternalLink
                href="https://on.cypress.io/changelog"
              >
                changelog
              </ExternalLink>.
            </p>
            <p>
              <strong>Existing Component Testing users</strong>, see the changelog to learn about breaking changes, and check out our <ExternalLink href="#">
                new guidelines
              </ExternalLink> about future framework and bundler support.
            </p>
          </div>
          <div>
            <h2 class="font-bold text-18px mb-16px text-jade-1000">
              Previous release highlights
            </h2>
            <div class="flex justify-between items-center">
              <ExternalLink
                href="https://on.cypress.io/changelog"
                class="font-bold text-indigo-500"
              >
                10.0.0
              </ExternalLink>
              <p class="font-light text-gray-500 text-14px">
                Released 6 months ago
              </p>
            </div>
            <p class="text-14px leading-20px">
              We've reworked the Cypress app from the ground up to modernize the interface, streamline workflows and integrate better into your overall development experience. Read about breaking changes in our
              <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
              <ExternalLink href="https://www.cypress.io/blog/2022/06/01/cypress-10-release/">blog post</ExternalLink>.
            </p>
          </div>
        </div>
        <div
          class="bg-white border-t-1 border-gray-100 w-full p-16px right-0 bottom-0 left-0 absolute"
          :class="{'bottom-bar-box-shadow': shouldShowShadow}"
        >
          <Button
            class="group"
            size="lg"
            @click="handleClick"
          >
            {{ t('majorVersionLandingPage.actionContinue') }}
            <template #suffix>
              <i-cy-chevron-right_x16 class="icon-dark-white" />
            </template>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'
import { useScroll, useElementSize } from '@vueuse/core'
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
  box-shadow: 0 -7px 11px -10px rgb(0 0 0 / 16%)
}
</style>
