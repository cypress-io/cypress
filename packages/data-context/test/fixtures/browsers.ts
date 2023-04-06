import { FoundBrowser } from "@packages/types";

export const foundBrowserChrome: FoundBrowser = {
  name: 'chrome',
  family: 'chromium',
  channel: 'stable',
  displayName: 'Chrome',
  path: '/usr/bin/chrome',
  version: '100.0.0'
} as const

export const userBrowser: Cypress.Browser = {
  ...foundBrowserChrome,
  name: 'User Custom Chromium Build',
  isHeaded: true,
  isHeadless: false,
  family: 'chromium',
  majorVersion: '100',
}