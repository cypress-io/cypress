<script setup lang="ts">
import { useGeolocation } from '.'

const { coords, locatedAt, error } = useGeolocation()
</script>

<template>
  <pre lang="json">{{
    JSON.stringify(
      {
        coords: {
          accuracy: coords.accuracy,
          latitude: coords.latitude,
          longitude: coords.longitude,
          altitude: coords.altitude,
          altitudeAccuracy: coords.altitudeAccuracy,
          heading: coords.heading,
          speed: coords.speed,
        },
        locatedAt,
        error: error ? error.message : error,
      },
      null,
      2
    )
  }}</pre>
</template>
