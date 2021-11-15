<template>
  <div
    class="grid grid-cols-2 outline-none children:cursor-pointer group h-full"
    data-testid="specs-list-row"
    role="link"
    tabindex="0"
  >
    <div>
      <slot name="file" />
    </div>
    <div>Git inof</div>

    <!-- <div class="grid git-info-row grid-cols-[16px,auto] items-center gap-9px">
      <span class="flex items-center justify-center w-16px">
        Icon
      </span>
      <div
        class="overflow-hidden truncate"
      >
        Git Info Text
      </div>
    </div>  -->
  </div>
</template>
