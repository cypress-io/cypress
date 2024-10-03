<template>
  <div
    id="selector-playground"
    class="border-t border-b bg-gray-50 border-gray-200 h-[56px] grid py-[12px] px-[16px] gap-[12px] grid-cols-[40px,1fr,auto] items-center "
  >
    <SelectorPlaygroundTooltip
      :hover-text="t('runner.selectorPlayground.playgroundTooltip')"
      class="flex h-full"
    >
      <button
        class="border rounded-md flex h-full outline-none border-gray-200 text-white transition w-[40px] duration-150 items-center justify-center hocus-default"
        :aria-label="selectorPlaygroundStore.isEnabled ? 'click to interact with the application and build test cases' : 'click to exit interactive test building mode'"
        data-cy="playground-toggle"
        @click="toggleEnabled"
      >
        <i-cy-selector_x16 :class="{ 'icon-dark-indigo-500': selectorPlaygroundStore.isEnabled, 'icon-dark-gray-500': !selectorPlaygroundStore.isEnabled }" />
      </button>
    </SelectorPlaygroundTooltip>
    <div
      class="flex h-full flex-1 w-full relative items-center"
      @mouseover="setShowingHighlight"
    >
      <Menu #="{ open }">
        <MenuButton
          :aria-label="t('runner.selectorPlayground.selectorMethodsLabel')"
          class="border border-r-transparent rounded-l-md flex h-full outline-none border-gray-200 text-white w-[40px] items-center justify-center hocus-default"
          @click.stop
        >
          <i-cy-chevron-down-small_x16
            class="transition transition-color duration-300"
            :class="open ? 'icon-dark-indigo-500' : 'icon-dark-gray-500'"
          />
        </MenuButton>
        <MenuItems
          class="rounded flex flex-col outline-transparent bg-gray-900 text-white top-[34px] z-40 absolute overflow-scroll"
        >
          <MenuItem
            v-for="method in methods"
            :key="method.display"
            #="{ active }"
          >
            <button
              :class="{ 'bg-gray-700': active }"
              class="border-b border-b-gray-800 text-left py-[8px] px-[16px]"
              @click="selectorPlaygroundStore.setMethod(method.value)"
            >
              {{ method.display }}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
      <code
        class="flex-1 py-[2px] pr-[2px] pl-0 relative overflow-hidden"
        :style="{height: 'calc(100% + 4px)'}"
      >
        <span
          class="flex pl-[12px] inset-y-0 text-gray-600 absolute items-center pointer-events-none"
          data-cy="selected-playground-method"
        >
          <span class="text-gray-800">cy</span>.<span class="text-purple-500">{{ selectorPlaygroundStore.method }}</span>(‘
        </span>
        <input
          v-model="selector"
          autocapitalize="none"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          aria-label="selector"
          data-cy="playground-selector"
          :style="{paddingLeft: leftOfInputText + 'ch', paddingRight: widthOfMatchesHelperText + 'px'}"
          class="border rounded-r-md font-medium h-full outline-none border-gray-200 w-full text-indigo-500 hocus-default overflow-ellipsis"
          :class="{'hocus-default': selectorPlaygroundStore.isValid, 'hocus-error': !selectorPlaygroundStore.isValid}"
        >
        <span
          class="flex inset-y-0 text-gray-600 absolute items-center pointer-events-none"
          :style="{
            left: `${leftOffsetForClosingParens}ch`,
          }"
        >’)</span>
        <div
          ref="match"
          class="bg-white border-l flex font-sans border-l-gray-200 my-[6px] px-[16px] inset-y-0 right-[3px] text-gray-600 absolute items-center"
          data-cy="playground-num-elements"
        >
          <template v-if="!selectorPlaygroundStore.isValid">
            <span class="text-error-400">{{ t('runner.selectorPlayground.invalidSelector') }}</span>
          </template>
          <template v-else>
            {{ t('runner.selectorPlayground.matches', selectorPlaygroundStore.numElements) }}
          </template>
        </div>
      </code>
    </div>

    <div class="flex gap-[12px]">
      <SelectorPlaygroundTooltip
        :hover-text="t('runner.selectorPlayground.copyTooltip')"
        :click-text="t('runner.selectorPlayground.copyTooltipAction')"
      >
        <template
          #default="{focus}"
        >
          <Button
            size="md"
            variant="outline"
            data-cy="playground-copy"
            class="override-border"
            aria-label="click to copy command to clipboard"
            @click="copyToClipboard"
            @focus="focus"
          >
            <i-cy-copy-clipboard_x16 class="icon-dark-gray-500" />
          </Button>
        </template>
      </SelectorPlaygroundTooltip>

      <SelectorPlaygroundTooltip
        :hover-text="t('runner.selectorPlayground.printTooltip')"
        :click-text="t('runner.selectorPlayground.printTooltipAction')"
      >
        <template
          #default="{focus}"
        >
          <Button
            key="fudge"
            size="md"
            variant="outline"
            data-cy="playground-print"
            class="override-border"
            aria-label="click to print command to console"
            @click="printSelected()"
            @focus="focus"
          >
            <i-cy-technology-terminal_x16 class="icon-dark-gray-600" />
          </Button>
        </template>
      </SelectorPlaygroundTooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import type { AutIframe } from '../aut-iframe'
import type { EventManager } from '../event-manager'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useElementSize } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@cy/gql-components/useClipboard'
import SelectorPlaygroundTooltip from './SelectorPlaygroundTooltip.vue'

const { t } = useI18n()

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

const methods = [
  {
    display: 'cy.get',
    value: 'get',
  }, {
    display: 'cy.contains',
    value: 'contains',
  },
] as const

const selectorPlaygroundStore = useSelectorPlaygroundStore()
const match = ref<HTMLDivElement>()
const { width: matcherWidth } = useElementSize(match)

// Text that is printed to the LEFT of the input
const leftOfInputText = computed(() => {
  return (selectorPlaygroundStore.method === 'get' ? 'cy.get(‘' : 'cy.contains(’').length + 1
})

const widthOfMatchesHelperText = computed(() => {
  // Arbitrary padding
  return matcherWidth.value + 32 + 24
})

const leftOffsetForClosingParens = computed(() => {
  return leftOfInputText.value + selector.value.length
})

watch(() => selectorPlaygroundStore.method, () => {
  props.getAutIframe().toggleSelectorHighlight(true)
})

const selector = computed({
  get () {
    return selectorPlaygroundStore.method === 'get'
      ? selectorPlaygroundStore.getSelector
      : selectorPlaygroundStore.containsSelector
  },
  set (value: string) {
    if (selectorPlaygroundStore.method === 'get') {
      selectorPlaygroundStore.getSelector = value
    }

    if (selectorPlaygroundStore.method === 'contains') {
      selectorPlaygroundStore.containsSelector = value
    }

    props.getAutIframe().toggleSelectorHighlight(true)
  },
})

function setShowingHighlight () {
  selectorPlaygroundStore.setShowingHighlight(true)
  props.getAutIframe().toggleSelectorHighlight(true)
}

function toggleEnabled () {
  const newVal = !selectorPlaygroundStore.isEnabled

  selectorPlaygroundStore.setEnabled(newVal)

  props.getAutIframe().toggleSelectorPlayground(newVal)
}

function printSelected () {
  props.getAutIframe().printSelectorElementsToConsole()
}

const { copy } = useClipboard({ copiedDuring: 2000 })
const copyToClipboard = () => {
  copy(selectorPlaygroundStore.command)
}
</script>

<style scoped lang="scss">
button.override-border {
  @apply border-gray-200
}
button.override-border:hover {
  @apply border-indigo-300
}
button.override-border:focus {
  @apply border-indigo-300
}
</style>
