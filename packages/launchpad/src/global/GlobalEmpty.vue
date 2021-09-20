<template>
  <main class="text-center">
    <h1 class="text-2rem mb-2">{{ t('globalPage.empty.title') }}</h1>
    <p class="text-lg font-light text-gray-600 mb-6">{{ t('globalPage.empty.helper') }}</p>
    <div
      type="button"
      @click="selectProject"
      class="min-w-220px relative block w-full border-2 bg-gray-50 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 text-center"
    >
      <IconPlaceholder
        class="-mb-8px mx-auto max-w-65px h-full relative justify-center w-full text-indigo-600"
      />
      <span class="mt-13px block text-lg font-medium text-gray-700 font-light">
        <i18n-t keypath="globalPage.empty.dropText">
          <button class="font-normal text-indigo-600 hover:underline" @click.stop="selectProject">{{ t('globalPage.empty.browseManually') }}</button>
        </i18n-t>
      </span>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from "../composables"
import IconPlaceholder from 'virtual:vite-icons/icons8/circle-thin'
import Button from '../components/button/Button.vue'

const { t } = useI18n()

const selectProject = () => { console.log('test')}
</script>
