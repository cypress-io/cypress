import { expect } from 'chai'

// Reproduces https://github.com/cypress-io/cypress/issues/26554 — a project
// compiling to ES2022 (the Angular 15+ default) that relies on native private
// fields and optional chaining. ts-loader emits these as-is, so the
// preprocessor must downlevel the output to our supported browser baseline.
class Interval {
  #hours: number
  #minutes: number

  constructor (hours: number, minutes: number) {
    this.#hours = hours
    this.#minutes = minutes
  }

  get totalMinutes (): number {
    return this.#hours * 60 + this.#minutes
  }
}

const interval = new Interval(2, 30)
const maybe: { interval?: Interval } = { interval }

expect(interval.totalMinutes).to.equal(150)
expect(maybe.interval?.totalMinutes).to.equal(150)
expect((maybe as any).missing?.totalMinutes).to.equal(undefined)
