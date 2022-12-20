<template>
  <div
    data-cy="debug-loading"
    class="p-30px"
  >
    <div>
      <div class="flex items-center">
        <div class="rounded-full bg-gray-50 h-16px w-344px" />
        <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
          .
        </div>
        <div class="rounded-full bg-gray-50 h-8px ml-8px w-120px" />
      </div>

      <div class="flex mt-15px items-center">
        <div class="rounded-full bg-gray-50 h-16px w-72px" />
        <div class="rounded-full bg-gray-50 h-16px ml-8px w-160px" />
        <div class="rounded-full bg-gray-50 h-16px ml-8px w-72px" />
        <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
          .
        </div>
        <div class="rounded-full bg-gray-50 h-8px ml-8px w-80px" />
        <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
          .
        </div>
        <div class="rounded-full bg-gray-50 h-8px ml-8px w-80px" />
        <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
          .
        </div>
        <div class="rounded-full bg-gray-50 h-8px ml-8px w-80px" />
        <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
          .
        </div>
        <div class="rounded-full bg-gray-50 h-8px ml-8px w-80px" />
      </div>
    </div>
    <div class="mt-20px">
      <div class="border-t border-l border-r rounded-t-md flex bg-gray-50 border-0 border-gray-100 w-full py-20px px-15px justify-between items-center">
        <div>
          <div class="flex items-center">
            <i-cy-dot-solid_x4 class="icon-light-gray-100" /><div class="rounded-full bg-gray-100 h-16px ml-8px w-200px" />
          </div>
          <div class="flex mt-20px items-center">
            <div class="rounded-full bg-gray-100 h-8px w-180px" />
            <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
              .
            </div>
            <div class="rounded-full bg-gray-100 h-8px ml-8px w-99px" />
            <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
              .
            </div>
            <div class="rounded-full bg-gray-100 h-8px ml-8px w-99px" />
          </div>
        </div>
        <div>
          <div class="rounded-full bg-gray-100 h-20px w-120px" />
        </div>
      </div>
    </div>
    <div
      v-for="i in [1, 2, 3]"
      :key="i"
      class="bg-white border flex border-b-0 border-gray-100 w-full py-5 px-17px items-center overflow-hidden"
      :class="{ 'border-b rounded-b-md': i === 3 }"
    >
      <div>
        <i-cy-dot-solid_x4 class="icon-light-gray-50" />
      </div>
      <div class="ml-10px">
        <div class="rounded-full bg-gray-50 h-16px w-200px" />
      </div>
      <div class="ml-10px">
        <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
      </div>
      <div class="ml-10px">
        <div
          class="rounded-full bg-gray-50 h-16px w-200px"
        />
      </div>
    </div>
    <div class="mt-20px">
      <div class="border-t border-l border-r rounded-t-md flex bg-gray-50 border-0 border-gray-100 w-full py-20px px-15px justify-between items-center">
        <div>
          <div class="flex items-center">
            <i-cy-dot-solid_x4 class="icon-light-gray-100" /><div class="rounded-full bg-gray-100 h-16px ml-8px w-200px" />
          </div>
          <div class="flex mt-20px items-center">
            <div class="rounded-full bg-gray-100 h-8px w-180px" />
            <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
              .
            </div>
            <div class="rounded-full bg-gray-100 h-8px ml-8px w-99px" />
            <div class="font-semibold mb-8px ml-8px text-14px text-gray-100">
              .
            </div>
            <div class="rounded-full bg-gray-100 h-8px ml-8px w-99px" />
          </div>
        </div>
        <div>
          <div class="rounded-full bg-gray-100 h-20px w-120px" />
        </div>
      </div>
    </div>
    <div
      v-for="i in [1, 2]"
      :key="i"
      class="bg-white border flex border-b-0 border-gray-100 w-full py-5 px-17px items-center overflow-hidden last:border-b last:rounded-b-md"
    >
      <div>
        <i-cy-dot-solid_x4 class="icon-light-gray-50" />
      </div>
      <div class="ml-10px">
        <div class="rounded-full bg-gray-50 h-16px w-200px" />
      </div>
      <div class="ml-10px">
        <i-cy-chevron-right_x16 class="icon-dark-gray-200" />
      </div>
      <div class="ml-10px">
        <div
          class="rounded-full bg-gray-50 h-16px w-200px"
        />
      </div>
    </div>
  </div>
</template>
