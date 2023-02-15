import { telemetry as baseTelemetry } from './index'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import pkg from '@packages/root'

let exporter

const init = ({ prefix, context }) => {
  exporter = new OTLPTraceExporter({
    url: 'https://api.honeycomb.io/v1/traces',
    headers: {
      'x-honeycomb-team': 'SX3l1S4dehdbek5ILftWNJ',
    },
  })

  baseTelemetry.init(prefix, new NodeTracerProvider({
    resource: new Resource({
      [ SemanticResourceAttributes.SERVICE_NAME ]: 'Cypress server',
      [ SemanticResourceAttributes.SERVICE_NAMESPACE ]: 'cy-namespace',
      [ SemanticResourceAttributes.SERVICE_VERSION ]: pkg.version,
      [ SemanticResourceAttributes.SERVICE_INSTANCE_ID ]: '1?',
    }),
  }), context, exporter)
}

const shutdown = () => {
  if (exporter) {
    return exporter.shutdown()
  }

  return Promise.resolve()
}

export const telemetry = {
  ...baseTelemetry,
  init,
  shutdown,
}
