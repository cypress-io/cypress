// Browsers refuse to load a URL on any of these ports with ERR_UNSAFE_PORT.
// The list mirrors Chromium's restricted ports in net/base/port_util.cc, which
// is also the Fetch standard's bad port list, so Chrome, Electron, Firefox and
// WebKit all block them.
const UNSAFE_PORTS = new Set([
  1, // tcpmux
  7, // echo
  9, // discard
  11, // systat
  13, // daytime
  15, // netstat
  17, // qotd
  19, // chargen
  20, // ftp data
  21, // ftp access
  22, // ssh
  23, // telnet
  25, // smtp
  37, // time
  42, // name
  43, // nicname
  53, // domain
  69, // tftp
  77, // priv-rjs
  79, // finger
  87, // ttylink
  95, // supdup
  101, // hostriame
  102, // iso-tsap
  103, // gppitnp
  104, // acr-nema
  109, // pop2
  110, // pop3
  111, // sunrpc
  113, // auth
  115, // sftp
  117, // uucp-path
  119, // nntp
  123, // NTP
  135, // loc-srv / epmap
  137, // netbios
  139, // netbios
  143, // imap2
  161, // snmp
  179, // BGP
  389, // ldap
  427, // SLP (also used by Apple Filing Protocol)
  465, // smtp+ssl
  512, // print / exec
  513, // login
  514, // shell
  515, // printer
  526, // tempo
  530, // courier
  531, // chat
  532, // netnews
  540, // uucp
  548, // AFP (Apple Filing Protocol)
  554, // rtsp
  556, // remotefs
  563, // nntp+ssl
  587, // smtp (rfc6409)
  601, // syslog-conn (rfc3195)
  636, // ldap+ssl
  989, // ftps-data
  990, // ftps
  993, // imap+ssl
  995, // pop3+ssl
  1719, // h323gatestat
  1720, // h323hostcall
  1723, // pptp
  2049, // nfs
  3659, // apple-sasl / PasswordServer
  4045, // lockd
  4190, // sieve
  5060, // sip
  5061, // sips
  6000, // X11
  6566, // sane-port
  6665, // Alternate IRC [Apple addition]
  6666, // Alternate IRC [Apple addition]
  6667, // Standard IRC [Apple addition]
  6668, // Alternate IRC [Apple addition]
  6669, // Alternate IRC [Apple addition]
  6679, // osaut
  6697, // IRC + TLS
  10080, // Amanda
])

export const isUnsafePort = (port: number): boolean => {
  return UNSAFE_PORTS.has(port)
}
