<template>
  <template v-if="props.gql">
    <li
      v-for="browser of browsers"
      :key="browser.id"
      class="border-b border-transparent cursor-pointer flex border-b-gray-50 border-[1px] min-w-[240px] py-[12px] px-[16px] transition-colors duration-300 group focus-within-default"
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
      <component
        :is="allBrowsersIcons[browser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
        class="mr-[16px] min-w-[26px] w-[26px] min-h-[45px]"
        :class="{ 'filter grayscale': browser.disabled || !browser.isVersionSupported }"
        alt=""
      />
      <div class="grow">
        <div>
          <button
            class="box-border font-medium focus:outline-none"
            :class="{
              'text-indigo-500 group-hover:text-indigo-700': !browser.isSelected && !browser.disabled && browser.isVersionSupported,
              'text-jade-700': browser.isSelected,
              'text-gray-500': browser.disabled || !browser.isVersionSupported
            }"
          >
            {{ browser.displayName }}
          </button>
          <div
            class="font-normal mr-[20px] text-gray-500 text-[14px] filter whitespace-nowrap group-focus-within:mix-blend-luminosity
            group-hover:mix-blend-luminosity
            "
          >
            {{ t('topNav.version') }} {{ browser.majorVersion }}
            <span v-if="!browser.isVersionSupported">
              (Unsupported)
            </span>
          </div>
        </div>
      </div>
      <div>
        <div class="flex items-center h-full align-middle">
          <template v-if="browser.isSelected">
            <div data-cy="top-nav-browser-list-selected-item">
              <i-cy-circle-check_x24 class="h-[24px] w-[24px] icon-dark-jade-100 icon-light-jade-500" />
            </div>
          </template>
          <template v-else-if="!browser.isVersionSupported">
            <div class="h-[16px] relative">
              <Tooltip>
                <i-cy-circle-bg-question-mark_x16
                  class="icon-dark-gray-700 icon-light-gray-200"
                  data-cy="unsupported-browser-tooltip-trigger"
                />
                <template #popper>
                  <div class="text-center p-2 text-gray-300 text-[14px] leading-[20px]">
                    <div class="mb-2 font-medium text-white">
                      Unsupported browser
                    </div>
                    {{ browser.warning }}
                  </div>
                </template>
              </Tooltip>
            </div>
          </template>
        </div>
      </div>
    </li>
  </template>
</template>
<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { VerticalBrowserListItems_SetBrowserDocument } from '../../generated/graphql'
import type { VerticalBrowserListItemsFragment } from '../../generated/graphql'
import { computed } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import Tooltip from '../../components/Tooltip.vue'

const { t } = useI18n()

gql`
fragment VerticalBrowserListItems on CurrentProject {
  id
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
mutation VerticalBrowserListItems_SetBrowser($id: ID!, $specPath: String) {
  launchpadSetBrowser(id: $id) {
    id
    ...VerticalBrowserListItems
  }
  launchOpenProject(specPath: $specPath) {
    id
  }
}
`

const props = withDefaults(defineProps <{
  selectable?: boolean
  gql: VerticalBrowserListItemsFragment
  specPath?: string
}>(), {
  selectable: false,
  specPath: '',
})

const browsers = computed(() => {
  return (props.gql.browsers ?? []).slice().sort((a, b) => a.displayName > b.displayName ? 1 : -1)
})

const setBrowser = useMutation(VerticalBrowserListItems_SetBrowserDocument)

const handleBrowserChoice = async (browser) => {
  if (browser.disabled || !browser.isVersionSupported || browser.isSelected) {
    return
  }

  const mutation = { id: browser.id, specPath: props.specPath }

  await setBrowser.executeMutation(mutation)
}

</script>
