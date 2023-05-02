import { telemetry } from '@packages/telemetry'

export const HANDLER_SPAN_NAME = `network:proxy:http:request:handle`

export const REQ_MW_SPAN_NAME = `network:proxy:http:request:middleware`

export const RES_MW_SPAN_NAME = `network:proxy:http:response:middleware`

export function createSpan (name: string, ctx, parentName: string = REQ_MW_SPAN_NAME) {
  const parentSpan = telemetry.getSpan(`${parentName}-${ctx.req.proxiedUrl}`)

  return telemetry.startSpan({ name: `${name}-${ctx.req.proxiedUrl}`, parentSpan })
}

export function createReqSpan (name: string, ctx) {
  return createSpan(name, ctx, REQ_MW_SPAN_NAME)
}

export function createResSpan (name: string, ctx) {
  return createSpan(name, ctx, RES_MW_SPAN_NAME)
}

export function getSpan (name: string, ctx) {
  return telemetry.getSpan(`${name}-${ctx.req.proxiedUrl}`)
}
