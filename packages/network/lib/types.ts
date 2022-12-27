export type ParsedHost = {
  port?: string
  tld?: string
  domain?: string
}

export type ParsedHostWithProtocolAndHost = {
  subdomain: string | null
  protocol: string | null
} & ParsedHost
