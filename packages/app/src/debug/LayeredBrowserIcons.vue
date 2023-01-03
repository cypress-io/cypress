<template>
  <ul
    data-cy="layered-browser-icons"
    class="flex mr-8px pl-8px"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      class="rounded-full rounded flex h-5 -ml-8px w-5 items-center justify-center"
      :class="(results.length > 1 ? 'bg-gray-50' : '')"
    >
      <component
        :is="result"
        size="16"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { IconBrowserChrome,
  IconBrowserChromeCanary,
  IconBrowserSafari,
  IconBrowserMozillaFirefox,
  IconBrowserEdge,
  IconBrowserWebkit,
  IconBrowserElectronLight,
} from '@cypress-design/vue-icon'

export type BrowserType = 'CHROME' | 'SAFARI' | 'FIREFOX' | 'CHROME-CANARY' | 'EDGE' | 'WEBKIT' | 'ELECTRON'

interface LayeredProps {
  order: BrowserType[]
}

const props = defineProps<LayeredProps>()

const results = computed(() => {
  if (props.order) {
    return props.order.map((status) => BROWSER_MAP[status])
  }

  return []
})

const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': IconBrowserChrome,
  'CHROME-CANARY': IconBrowserChromeCanary,
  'SAFARI': IconBrowserSafari,
  'FIREFOX': IconBrowserMozillaFirefox,
  'EDGE': IconBrowserEdge,
  'WEBKIT': IconBrowserWebkit,
  'ELECTRON': IconBrowserElectronLight,
}

</script>
