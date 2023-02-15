import { telemetry as baseTelemetry } from './index'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const init = ({ prefix, context }) => {
  const exporter = new OTLPTraceExporter({
    url: 'https://api.honeycomb.io/v1/traces',
    headers: {
      'x-honeycomb-team': 'SX3l1S4dehdbek5ILftWNJ',
    },
  })

  baseTelemetry.init(prefix, new WebTracerProvider({
    resource: new Resource({
      [ SemanticResourceAttributes.SERVICE_NAME ]: 'Cypress server',
      [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: 'cy-namespace',
      [ SemanticResourceAttributes.SERVICE_VERSION ]: '12.5.0',
      [ SemanticResourceAttributes.SERVICE_INSTANCE_ID ]: '1?',
    }),
  }), context, exporter)
}

export const telemetry = {
  ...baseTelemetry,
  init,
}
