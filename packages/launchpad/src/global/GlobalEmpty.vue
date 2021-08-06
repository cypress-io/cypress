<template>
  <main class="text-center">
    <h1 class="text-2rem mb-2">{{ t('globalPage.empty.title') }}</h1>
    <p class="text-lg font-light text-gray-600 mb-6">{{ t('globalPage.empty.helper') }}</p>
    <button type="button" @click="selectProject" class="min-w-220px relative block w-full border-2 bg-gray-50 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 text-center">
      <div class="placeholder mt-0 mx-auto mb-1"></div>
      <span class="mt-13px block text-lg font-medium text-gray-700 font-light">
        <i18n-t keypath="globalPage.empty.dropText">
          <a class="font-normal" @click="selectProject">{{ t('globalPage.empty.browseManually') }}</a>
        </i18n-t>
      </span>
    </button>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from "../composables";

const { t } = useI18n()

const selectProject = () => {}
</script>

<style>
.placeholder {
  /* Illustration */
  position: relative;
  width: 54px;
  height: 54px;
  left: 0px;
  top: 0px;

  /* Primary/Indigo/200 */

  background: #CAD2FA;
  /* Primary/Indigo/400 */

  border: 2px solid #6B7DE8;
  box-sizing: border-box;

  /* Inside Auto Layout */

  flex: none;
  order: 0;
  flex-grow: 0;
  margin: 0;
  border-radius: 100%;
}
</style>
