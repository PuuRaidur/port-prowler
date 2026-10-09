# Port Prowler

A command-line port scanner built with Node.js that supports TCP connect, UDP, and TCP SYN (stealth) scans.

## Setup

```bash
git clone git@gitea.kood.tech:georgkaasik/port-prowler.git
cd port-prowler
npm install
```

**Prerequisites:**
- Node.js v24+
- Build tools for native addon (`gcc`, `make`, `python3`)
- Elevated privileges for stealth scan

**Note:** If npm blocks the raw-socket build script, run:
```bash
npm install-scripts approve @justjam2013/raw-socket
npm rebuild
```

## Usage

```
node port_prowler.js <ip> [OPTIONS]
```

| Flag | Description |
|------|-------------|
| `-p, --ports` | Ports (single: `80`, multiple: `80,443`, range: `1-1000`) |
| `-tcp` | TCP connect scan |
| `-udp` | UDP scan |
| `-s, --stealth` | TCP SYN scan (requires root) |
| `-f, --file` | Save results to file |
| `-h, --help` | Show help |

**Examples:**
```bash
node port_prowler.js 172.16.0.1 -p 80,443,8080 -tcp
node port_prowler.js 172.16.0.1 -p 20-30 -udp
sudo $(which node) port_prowler.js 172.16.0.1 -p 22,80 -s
node port_prowler.js 172.16.0.1 -p 80 -tcp -udp -f results.txt
```

## How it works

- **TCP connect** — completes the 3-way handshake. `connect` → open, `error` (RST) → closed, timeout → filtered.
- **UDP** — sends an empty payload. Response → open, ICMP unreachable → closed, timeout → open|filtered.
- **Stealth (SYN)** — sends a bare SYN via raw sockets without completing the handshake. SYN/ACK → open, RST → closed, timeout → filtered.

## Known limitations

- UDP scan sends protocol-specific probes on known ports (53, 67, 68, 69, 111, 123, 137, 161, 500, 1194, 1701, 2049, 5353); all other ports get an empty payload and report `open|filtered` because services ignore empty packets.
- Some UDP probes are inherently limited: 68 (DHCP client) has no listener that responds, and 5353 (mDNS) replies are multicast so they are not received by a connected socket. 162 (SNMP trap) and 514 (syslog) are send-only protocols with no useful probe — these ports still report `open|filtered`.
- Stealth scan requires elevated privileges (raw sockets).
- UDP classification: `closed` on ICMP port-unreachable, `filtered` on other ICMP unreachable errors (e.g. admin-prohibited), `open|filtered` when there is no response. Silent firewall drops are indistinguishable from a silent open service, so they remain `open|filtered`.