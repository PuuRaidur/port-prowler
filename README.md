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

- UDP scan sends an empty payload — ports with UDP services (e.g. DNS on 53) report `open|filtered` instead of `open` because services ignore empty packets. Nmap sends protocol-specific probes for comparison.
- Stealth scan requires root privileges (raw sockets).
- UDP-only mode cannot distinguish `filtered` from `open|filtered` without ICMP responses.