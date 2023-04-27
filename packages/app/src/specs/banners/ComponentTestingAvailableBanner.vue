<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="component-testing-banner"
    status="default"
    :title="title"
    class="mb-16px"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'TODO',
      medium: 'TODO',
      cohort: 'n/a'
    }"
  >
    <div class="flex flex-row">
      <component
        :is="icon"
        width="80"
        data-cy="framework-icon"
      />
      <p class="ml-16px">
        {{ t('specPage.banners.ct.content') }}
      </p>
    </div>
    <hr class="my-16px">
    <div class="flex flex-row">
      <Button variant="outline">
        {{ t('specPage.banners.ct.primaryAction') }}
      </Button>
      <Button variant="link">
        {{ t('specPage.banners.ct.secondaryAction') }}
      </Button>
      <span class="flex-grow" />
      <Button variant="link">
        {{ t('specPage.banners.ct.dismissAction') }}
      </Button>
    </div>
  </TrackedBanner>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { FrameworkBundlerLogos } from '@packages/frontend-shared/src/utils/icons'

const props = defineProps<{
  hasBannerBeenShown: boolean
  framework: {
    name: string
    icon: keyof typeof FrameworkBundlerLogos
  }
}>()

const { t } = useI18n()
const bannerId = BannerIds.CT_052023_AVAILABLE

const title = computed(() => t('specPage.banners.ct.title', [props.framework?.name]))
const icon: any = computed(() => FrameworkBundlerLogos[props.framework?.icon])

</script>
