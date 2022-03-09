<template>
  <div
    id="selector-playground"
    class="border-t border-b bg-gray-50 border-gray-200 h-56px grid py-12px px-16px gap-12px grid-cols-[40px,1fr,auto] items-center "
  >
    <button
      class="border rounded-md flex h-full outline-none text-white transition w-40px duration-150 items-center justify-center hover:default-ring"
      :class="[ selectorPlaygroundStore.isEnabled ? 'default-ring' : 'border-gray-200']"
      data-cy="playground-toggle"
      @click="toggleEnabled"
    >
      <i-cy-selector_x16 :class="{ 'icon-dark-indigo-500': selectorPlaygroundStore.isEnabled, 'icon-dark-gray-500': !selectorPlaygroundStore.isEnabled }" />
    </button>
    <div
      class="flex h-full flex-1 w-full relative items-center"
      @mouseover="setShowingHighlight"
    >
      <Menu #="{ open }">
        <MenuButton
          :aria-label="t('runner.selectorPlayground.selectorMethodsLabel')"
          class="border border-r-transparent rounded-l-md flex h-full outline-none border-gray-200 text-white w-40px items-center justify-center hocus-default"
          @click.stop
        >
          <i-cy-chevron-down-small_x16
            class="transition transition-color duration-300"
            :class="open ? 'icon-dark-indigo-500' : 'icon-dark-gray-500'"
          />
        </MenuButton>
        <MenuItems
          class="rounded flex flex-col outline-transparent bg-gray-900 text-white top-34px z-40 absolute overflow-scroll"
        >
          <MenuItem
            v-for="method in methods"
            :key="method.display"
            #="{ active }"
          >
            <button
              :class="{ 'bg-gray-700': active }"
              class="border-b border-b-gray-800 text-left py-8px px-16px"
              @click="selectorPlaygroundStore.setMethod(method.value)"
            >
              {{ method.display }}
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
      <code class="h-full flex-1 relative">
        <span
          ref="ghostLeft"
          class="flex pl-12px inset-y-0 text-gray-600 absolute items-center pointer-events-none"
          data-cy="selected-playground-method"
        >
          <span class="text-gray-800">cy</span>.<span class="text-purple-500">{{ selectorPlaygroundStore.method }}</span>(‘
        </span>
        <span
          ref="ghostRight"
          class="font-medium left-[-9999px] absolute inline-block"
        >{{ selector.replace(/\s/g, '&nbsp;') }}</span>
        <span
          class="flex inset-y-0 text-gray-600 absolute items-center pointer-events-none"
          :style="{left: inputRightOffset + 'px'}"
        >‘)</span>
        <input
          ref="copyText"
          v-model="selector"
          data-cy="playground-selector"
          :style="{paddingLeft: inputLeftOffset + 'px', paddingRight: matcherWidth + 32 + 24 + 'px'}"
          class="border rounded-r-md font-medium h-full outline-none border-gray-200 w-full text-indigo-500 hocus-default overflow-ellipsis"
          :class="{'hocus-default': selectorPlaygroundStore.isValid, 'hocus-error': !selectorPlaygroundStore.isValid}"
        >
        <div
          ref="match"
          class="border-l flex font-sans border-l-gray-200 my-6px px-16px inset-y-0 right-0 text-gray-600 absolute items-center"
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

    <div class="flex gap-12px">
      <SelectorPlaygroundTooltip>
        <Button
          size="md"
          variant="outline"
          data-cy="playground-copy"
          class="override-border"
          @click="copyToClipboard"
        >
          <i-cy-copy-clipboard_x16 class="icon-dark-gray-500" />
        </Button>
        <template #popper>
          <div
            class="whitespace-nowrap"
            data-cy="playground-copy-tooltip"
          >
            {{ t('runner.selectorPlayground.copyTooltip') }}
          </div>
        </template>
      </SelectorPlaygroundTooltip>

      <SelectorPlaygroundTooltip>
        <Button
          size="md"
          variant="outline"
          data-cy="playground-print"
          class="override-border"
          @click="printSelected"
        >
          <i-cy-technology-terminal_x16 class="icon-dark-gray-600" />
        </Button>
        <template #popper>
          <div
            class="whitespace-nowrap"
            data-cy="playground-print-tooltip"
          >
            {{ t('runner.selectorPlayground.printTooltip') }}
          </div>
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
import SelectorPlaygroundTooltip from './SelectorPlaygroundTooltip.vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@cy/gql-components/useClipboard'

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

const copyText = ref<HTMLInputElement>()

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

const inputSize = useElementSize(copyText)

// spooky
const ghostLeft = ref<HTMLSpanElement>()
const { width: ghostLeftWidth } = useElementSize(ghostLeft)
const inputLeftOffset = computed(() => ghostLeftWidth.value + 12)

const ghostRight = ref<HTMLSpanElement>()
const { width: ghostRightWidth } = useElementSize(ghostRight)
const inputRightOffset = computed(() => {
  const leftOffset = inputLeftOffset.value
  const combined = leftOffset + ghostRightWidth.value
  const max = inputSize.width.value + leftOffset

  return combined <= max ? combined : max
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
  copy(selector.value)
}
</script>

<style scoped lang="scss">
#selector-playground {
  height: 40px;
}
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
