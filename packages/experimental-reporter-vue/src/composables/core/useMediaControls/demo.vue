<script setup lang="ts">
import Scrubber from './components/Scrubber.vue'
import Menu from './components/Menu.vue'
import MenuItem from './components/MenuItem.vue'
import Spinner from './components/Spinner.vue'

import { ref, reactive, computed } from 'vue'
import { stringify } from '@vueuse/docs-utils'
import { useMediaControls } from '.'

const video = ref<HTMLVideoElement>()
const loop = ref(false)
const poster = 'https://bitmovin.com/wp-content/uploads/2016/06/sintel-poster.jpg'

const controls = useMediaControls(video, {
  src: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.1080p.vp9.webm',
    type: 'video/webm',
  },
  tracks: [
    {
      default: true,
      src: 'https://gist.githubusercontent.com/jacobclevenger/a85a65a82d87d7c098e1a0972ef1f726/raw/f135ca4b6ce78552d80b515d68af5f5e5e2eb7c5/sentil-subtitles.vtt',
      kind: 'subtitles',
      label: 'English',
      srcLang: 'en',
    },
    {
      src: 'https://gist.githubusercontent.com/jacobclevenger/38f32925d20c683bf77ba33ff737891b/raw/0505e841cbbc3a4a598584b57ab411d29bfdcf0d/subtitles-fr.vtt',
      kind: 'subtitles',
      label: 'French',
      srcLang: 'fr',
    },
  ],
})

const {
  playing,
  buffered,
  currentTime,
  duration,
  tracks,
  waiting,
  selectedTrack,
  volume,
  muted,
  isPictureInPicture,
  supportsPictureInPicture,
  togglePictureInPicture,
  enableTrack,
  disableTrack,
} = controls
const text = stringify(reactive(controls))
const endBuffer = computed(() => buffered.value.length > 0 ? buffered.value[buffered.value.length - 1][1] : 0)
const formatDuration = (seconds: number) => new Date(1000 * seconds).toISOString().substr(14, 5)
</script>

<template>
  <div
    class="outline-none"
    :tabindex="0"
    autofocus
    @keydown.prevent.space="playing = !playing"
    @keydown.right="currentTime += 10"
    @keydown.left="currentTime -= 10"
  >
    <div class="relative bg-black">
      <video
        ref="video"
        crossorigin="anonymous"
        class="w-full block"
        :poster="poster"
        :loop="loop"
        @click="playing = !playing"
      />
      <div v-if="waiting" class="absolute inset-0 grid place-items-center pointer-events-none bg-black bg-opacity-20">
        <Spinner />
      </div>
    </div>

    <Scrubber v-model="currentTime" :max="duration" :secondary="endBuffer" class="mt-2">
      <template #default="{ position, pendingValue }">
        <div
          class="absolute transform -translate-x-1/2 bg-black rounded px-2 bottom-0 mb-4 py-1 text-xs text-white"
          :style="{ left: position }"
        >
          {{ formatDuration(pendingValue) }}
        </div>
      </template>
    </Scrubber>

    <div class="flex flex-row items-center items-center">
      <button @click="playing = !playing">
        <carbon-play v-if="!playing" />
        <carbon-pause v-else />
      </button>
      <button @click="muted = !muted">
        <carbon-volume-mute v-if="muted" />
        <carbon-volume-up v-else />
      </button>
      <Scrubber v-model="volume" :max="1" class="w-32 ml-2" />
      <div class="flex flex-col flex-1 text-sm ml-2">
        {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
      </div>

      <Menu class="mr-2">
        <template #default="{ open }">
          <button @click="open">
            <carbon-closed-caption />
          </button>
        </template>
        <template #menu="{ close }">
          <div class="absolute bottom-0 right-0 bg-black rounded py-2 shadow">
            <MenuItem
              @keydown.stop.prevent.enter.space="disableTrack()"
              @click="() => { disableTrack(); close() }"
            >
              <span class="flex-1">Off</span>
              <carbon-checkmark :class="{ 'opacity-0': selectedTrack !== -1 }" />
            </MenuItem>
            <MenuItem
              v-for="track in tracks"
              :key="track.id"
              @keydown.stop.prevent.enter.space="enableTrack(track)"
              @click="() => { enableTrack(track); close() }"
            >
              <span class="flex-1">{{ track.label }}</span>
              <carbon-checkmark :class="{ 'opacity-0': track.mode !== 'showing' }" />
            </MenuItem>
          </div>
        </template>
      </Menu>
      <Menu>
        <template #default="{ open }">
          <button class="block" @click="open()">
            <carbon-settings />
          </button>
        </template>
        <template #menu="{ close }">
          <div class="absolute bottom-0 right-0 shadow py-2 bg-black rounded">
            <MenuItem v-if="supportsPictureInPicture" @click="() => { togglePictureInPicture(); close(); }">
              <carbon-popup />
              <span>{{ isPictureInPicture ? 'Exit' : 'Enter' }} Picture in Picture</span>
            </MenuItem>
            <MenuItem @click="() => { loop = !loop; close(); }">
              <carbon-repeat />
              <span class="flex-1">Loop</span>
              <carbon-checkmark v-if="loop" />
            </MenuItem>
          </div>
        </template>
      </Menu>
    </div>
  </div>
  <pre lang="yaml">{{ text }}</pre>
</template>
