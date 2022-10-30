<template>
  <div class="bg-no-repeat bg-cover h-screen min-h-700px lp-wrapper">
    <div class="border-transparent rounded mx-auto bg-gray-50/50 border-4px max-w-80vw transform top-[50%] w-688px -translate-y-[50%] relative overflow-hidden">
      <div class="bg-white rounded-b p-16px overflow-hidden">
        <h1 class="font-medium text-center mb-32px tracking-tighter text-22px text-teal-1000">
          {{ t('majorVersionLandingPage.title') }}
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
            Existing Component Testing users, see the changelog to learn about breaking changes, and check out our <ExternalLink href="#">
              new guidelines
            </ExternalLink> about future framework and bundler support.
          </p>
        </div>

        <Button
          class="mb-16px group"
          size="lg"
          @click="handleClick"
        >
          {{ t('majorVersionLandingPage.actionContinue') }}
          <template #suffix>
            <i-cy-chevron-right_x16 class="icon-dark-white" />
          </template>
        </Button>
        <div>
          <h2 class="font-bold">
            Previous release highlights
          </h2>
          <div class="flex justify-between">
            <ExternalLink
              href="https://on.cypress.io/changelog"
              class="font-bold text-indigo-500"
            >
              10.0.0
            </ExternalLink>
            <p class="font-light">
              Released 6 months ago
            </p>
          </div>
          <p class="text-14px leading-20px">
            We've reworked the Cypress app from the ground up to modernize the interface, streamline workflows and integrate better into your overall development experience. Read about breaking changes in our blog post.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (eventName: 'clearLandingPage', value: void): void
}>()

const handleClick = () => {
  emit('clearLandingPage')
}

</script>

<style scoped lang="scss">
.lp-wrapper {
  background-image: url("../images/Background.svg");
}

.video {
  aspect-ratio: 15 / 9;

  // since we support pre-aspect-ratio browsers,
  // the classic padding hack is used here
  // https://css-tricks.com/aspect-ratio-boxes/#aa-the-pseudo-element-tactic
  // https://codepen.io/una/pen/BazyaOM

  @supports not (aspect-ratio: 15 / 9) {
    &::before {
      float: left;
      padding-top: 60%;
      content: '';
    }

    &::after {
      display: block;
      content: '';
      clear: both;
    }
  }
}
</style>
