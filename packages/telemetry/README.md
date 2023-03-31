# @packages/telemetry

This package is convenience wrapper built around open telemetry to allow us to gain insights around how cypress is used and help us prevent performance regressions.

## tl;dr

Telemetry in cypress is off by default. To enable telemetry in cypress set `CYPRESS_INTERNAL_ENABLE_TELEMETRY="true"`.

Telemetry data is sent to the cloud `/telemetry` endpoint.

For the **cypress cloud project only** we forward the telemetry data to honeycomb. For all other projects telemetry data is not stored.

Staging: https://ui.honeycomb.io/cypress/environments/cypress-app-staging/datasets/cypress-app/home

Prod: https://ui.honeycomb.io/cypress/environments/cypress-app/datasets/cypress-app/home

## Design

```mermaid
sequenceDiagram
rect rbg(166, 224, 227)
activate Cypress Server
Cypress Server->>Cypress Server: Initialize Main Process Telemetry Singleton
Cypress Server->>Cypress Child Process: Start Child Process - Send Context
activate Cypress Child Process
Cypress Child Process->>Cypress Child Process: Initialize Child Process Telemetry Singleton
deactivate Cypress Child Process
Cypress Server->>Cypress App: Launch Browser - Send Context
deactivate Cypress Server
activate Cypress App
Cypress App->>Cypress App: Initialize  Browser Telemetry Singleton
deactivate Cypress App
end
par Cypress App->>Cypress App: Span Starts
activate Cypress App
Cypress App->>Cypress Server: Span Ends, <br>send telemetry to cypress server.
deactivate Cypress App
activate Cypress Server
Note right of Cypress App: Uses the web socket to avoid <br> network calls that would show up<br> in cypress logs
and Cypress Child Process->>Cypress Child Process: Span Starts
activate Cypress Child Process
Cypress Child Process->>Cypress Server: Span Ends, <br>send telemetry to cypress server.
deactivate Cypress Child Process
Note over Cypress Child Process, Cypress App: Uses the IPC to avoid <br> encrypting in the child process
end
Cypress Server->>Cypress Cloud: Encrypt Span, forward to Cloud
deactivate Cypress Server
activate Cypress Cloud
Note right of Cypress Server: Telemetry data will always be <br>encrypted
alt Cypress project
Cypress Cloud->>Honeycomb: Decrypt span data, forward to honeycomb
else not Cypress project
Cypress Cloud->>Cypress OTEL Store: Decrypt span data, forward to OTEL Store(future)
deactivate Cypress Cloud
Note right of Cypress Cloud: For now we could dead end this data <br> until we're ready to store more.
end
```

## Setup

## Usage

### Spans

### Metrics

The metrics api is tbd.

## Open Telemetry Links

[otel docs](https://opentelemetry.io/docs/)
[otel sdk](https://open-telemetry.github.io/opentelemetry-js/index.html)
