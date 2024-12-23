<template>
  <ul
    data-cy="layered-browser-icons"
    class="flex mr-[8px] pl-[8px]"
  >
    <li
      v-for="(result, i) in results"
      :key="i"
      class="rounded-full rounded flex h-5 ml-[-8px] w-5 items-center justify-center"
      :class="(results.length > 1 ? 'bg-gray-50' : '')"
    >
      <component
        :is="result.icon"
        :data-cy="result.name"
        size="16"
      />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import {
  IconBrowserChrome,
  IconBrowserChromeBeta,
  IconBrowserChromeCanary,
  IconBrowserMozillaFirefox,
  IconBrowserEdge,
  IconBrowserWebkit,
  IconBrowserElectronLight,
  IconGeneralGlobe,
} from '@cypress-design/vue-icon'

// Note: These browser names should map to the list of logoPaths found at https://github.com/cypress-io/cypress-services/blob/develop/packages/common/src/logos/getLogoPath.ts
export type BrowserType = 'CHROME' | 'CHROME BETA' | 'CANARY' | 'CHROME CANARY' | 'CHROME FOR TESTING' | 'CUSTOM CHROME FOR TESTING' | 'CHROMIUM' | 'CUSTOM CHROMIUM' | 'EDGE' | 'EDGE BETA' | 'EDGE CANARY' | 'EDGE DEV' | 'ELECTRON' | 'FIREFOX' | 'FIREFOX DEVELOPER EDITION' | 'FIREFOX NIGHTLY' | 'WEBKIT'

interface LayeredProps {
  browsers: BrowserType[]
}

const props = defineProps<LayeredProps>()

const results = computed(() => {
  if (props.browsers) {
    return props.browsers.map((browserType) => {
      return {
        icon: BROWSER_MAP[browserType] || IconGeneralGlobe,
        name: `browser-icon-${browserType.toLowerCase().replaceAll(' ', '_')}`,
      }
    })
  }

  return []
})

// TODO: Add correct icons for firefox, edge, and chromium
const BROWSER_MAP: Record<BrowserType, any> = {
  'CHROME': IconBrowserChrome,
  'CHROME BETA': IconBrowserChromeBeta,
  'CANARY': IconBrowserChromeCanary,
  'CHROME CANARY': IconBrowserChromeCanary,
  'CHROME FOR TESTING': IconBrowserChrome,
  'CUSTOM CHROME FOR TESTING': IconBrowserChrome,
  'CHROMIUM': IconGeneralGlobe,
  'CUSTOM CHROMIUM': IconGeneralGlobe,
  'EDGE': IconBrowserEdge,
  'EDGE BETA': IconBrowserEdge,
  'EDGE CANARY': IconBrowserEdge,
  'EDGE DEV': IconBrowserEdge,
  'ELECTRON': IconBrowserElectronLight,
  'FIREFOX': IconBrowserMozillaFirefox,
  'FIREFOX DEVELOPER EDITION': IconBrowserMozillaFirefox,
  'FIREFOX NIGHTLY': IconBrowserMozillaFirefox,
  'WEBKIT': IconBrowserWebkit,
}

</script>
