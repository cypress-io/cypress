<template>
  <div
    class="border rounded bg-gray-200 border-gray-200 mt-16px
      w-full grid gap-1px grid-rows-[48px,1fr] grid-cols-2 overflow-hidden"
  >
    <div class="flex font-semibold bg-gray-50 px-16px text-gray-800 items-center">
      <slot name="beforeHeader">
        Before
      </slot>
    </div>
    <div class="flex font-semibold bg-gray-50 px-16px text-gray-800 items-center">
      <slot name="afterHeader">
        After
      </slot>
    </div>
    <div class="bg-white py-4px">
      <slot name="before" />
    </div>
    <div class="bg-white py-4px">
      <slot name="after" />
    </div>
  </div>
</template>
