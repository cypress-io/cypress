import { LitCounter } from './counter-lit';
import { WebCounter } from './counter-wc';

export * from './counter-lit'
export * from './counter-wc'

declare global {
  interface HTMLElementTagNameMap {
    "counter-lit": LitCounter;
    "counter-wc": WebCounter;
  }
}
