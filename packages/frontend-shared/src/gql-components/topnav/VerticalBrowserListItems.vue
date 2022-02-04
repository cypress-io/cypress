<template>
  <template v-if="props.gql">
    <li
      v-for="browser in props.gql.browsers"
      :key="browser.id"
      class="border-b border-transparent cursor-pointer flex border-b-gray-50 border-1px min-w-240px py-12px px-16px transition-colors duration-300 group focus-within-default"
      :class="{
        'bg-jade-50': browser.isSelected,
        'hover:bg-indigo-50 focus-within:bg-indigo-50': !browser.isSelected && !browser.disabled && browser.isVersionSupported,
        'bg-gray-50 cursor-not-allowed': browser.disabled || !browser.isVersionSupported,
        'cursor-pointer': !browser.disabled && browser.isVersionSupported
      }"
      data-cy="top-nav-browser-list-item"

      :data-browser-id="browser.id"
      @click="handleBrowserChoice(browser)"
    >
      <img
        class="mr-16px min-w-26px w-26px"
        :class="{ 'filter grayscale': browser.disabled || !browser.isVersionSupported }"
        :src="allBrowsersIcons[browser.displayName] || allBrowsersIcons.generic"
      >
      <div class="flex-grow">
        <div>
          <button
            class="font-medium box-border focus:outline-none"
            :class="{
              'text-indigo-500 group-hover:text-indigo-700': !browser.isSelected && !browser.disabled && browser.isVersionSupported,
              'text-jade-700': browser.isSelected,
              'text-gray-500': browser.disabled || !browser.isVersionSupported
            }"
          >
            {{ browser.displayName }}
          </button>
          <div
            class="font-normal mr-20px text-gray-500 text-14px filter whitespace-nowrap group-focus-within:mix-blend-luminosity
            group-hover:mix-blend-luminosity
            "
          >
            {{ t('topNav.version') }} {{ browser.version }}
          </div>
        </div>
      </div>
      <div>
        <div
          class="flex h-full items-center align-middle"
        >
          <template
            v-if="browser.isSelected"
          >
            <div data-cy="top-nav-browser-list-selected-item">
              <i-cy-circle-check_x24 class="h-24px w-24px icon-dark-jade-100 icon-light-jade-500" />
            </div>
          </template>
          <template v-else-if="!browser.isVersionSupported">
            <div class="h-16px relative">
              <UnsupportedBrowserTooltip class="top-0 right-0 absolute">
                <i-cy-circle-bg-question-mark_x16 class="icon-dark-gray-700 icon-light-gray-200" />
                <template #popper>
                  <div class="w-full">
                    <div class="font-medium text-white mb-2">
                      Unsupported browser
                    </div>
                    {{ browser.warning }}
                  </div>
                </template>
              </UnsupportedBrowserTooltip>
            </div>
          </template>
        </div>
      </div>
    </li>
  </template>
</template>
<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { VerticalBrowserListItemsFragment, VerticalBrowserListItems_LaunchOpenProjectDocument, VerticalBrowserListItems_SetBrowserDocument } from '../../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import UnsupportedBrowserTooltip from './UnsupportedBrowserTooltip.vue'

const { t } = useI18n()

gql`
fragment VerticalBrowserListItems on CurrentProject {
  id
  currentBrowser {
    id
    displayName
    majorVersion
  }
  browsers {
    id
    isSelected
    displayName
    version
    majorVersion
    isVersionSupported
    warning
    disabled
  }
}
`

gql`
mutation VerticalBrowserListItems_LaunchOpenProject {
  launchOpenProject {
    id
  }
}
`

gql`
mutation VerticalBrowserListItems_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id) {
    id
    ...VerticalBrowserListItems
  }
}
`

const props = defineProps<{
  selectable?: Boolean,
  gql: VerticalBrowserListItemsFragment,
}>()

const launchOpenProject = useMutation(VerticalBrowserListItems_LaunchOpenProjectDocument)
const setBrowser = useMutation(VerticalBrowserListItems_SetBrowserDocument)

const launch = () => {
  launchOpenProject.executeMutation({})
}

const handleBrowserChoice = async (browser) => {
  if (browser.disabled || !browser.isVersionSupported) {
    return
  }

  await setBrowser.executeMutation({ id: browser.id })
  launch()
}

</script>
