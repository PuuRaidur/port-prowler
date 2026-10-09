import raw from "@justjam2013/raw-socket"
import crypto from "node:crypto"
import dgram from "node:dgram"
import chalk from "chalk"

// gets the local IP address used to reach the target
function getIP(ip) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket("udp4")
        socket.once("error", (err) => {
            try { socket.close() } catch (e) {}
            reject(err)
        })
        socket.connect(1, ip, () => {
            const addr = socket.address().address
            socket.close()
            resolve(addr)
        })
    })
}

// performs a TCP SYN stealth scan on a port
export default async function stealthScan(ip, port, timeout) {
    // create raw TCP socket (requires root privileges)
    let socket
    try {
        socket = raw.createSocket({
            addressFamily: raw.AddressFamily.IPv4,
            protocol: raw.Protocol.TCP
        })
    } catch (e) {
        console.log(chalk.red.bold("Error: Stealth scan requires elevated privileges."))
        process.exit(1)
    }

    // generate random ephemeral source port and sequence number
    const srcPort = crypto.randomInt(32768, 60999)
    const seqNum = crypto.randomBytes(4).readUInt32BE(0)

    // determine IP for TCP checksum pseudo-header
    const IP = await getIP(ip)

    // build 20-byte TCP SYN header
    const tcpHeader = Buffer.alloc(20)
    tcpHeader.writeUInt16BE(srcPort, 0)     // source port
    tcpHeader.writeUInt16BE(port, 2)        // destination port
    tcpHeader.writeUInt32BE(seqNum, 4)      // sequence number
    tcpHeader.writeUInt32BE(0, 8)           // ack number = 0
    tcpHeader.writeUInt8(0x50, 12)          // data offset = 5 (20 bytes)
    tcpHeader.writeUInt8(0x02, 13)          // flags = SYN
    tcpHeader.writeUInt16BE(0x2000, 14)     // window size
    tcpHeader.writeUInt16BE(0, 16)          // checksum (computed below)
    tcpHeader.writeUInt16BE(0, 18)          // urgent pointer = 0

    // build 12-byte pseudo-header for TCP checksum
    const pseudoHeader = Buffer.alloc(12)
    Buffer.from(IP.split(".").map(Number)).copy(pseudoHeader, 0)
    Buffer.from(ip.split(".").map(Number)).copy(pseudoHeader, 4)
    pseudoHeader.writeUInt8(6, 9)           // protocol = TCP
    pseudoHeader.writeUInt16BE(20, 10)      // TCP segment length

    // compute TCP checksum over pseudo-header + TCP header
    const checksum = raw.createChecksum(pseudoHeader, tcpHeader)
    raw.writeChecksum(tcpHeader, 16, checksum)

    return new Promise((resolve) => {
        // resolve with status and clean up socket
        const finish = (status) => {
            clearTimeout(timer)
            try { socket.close() } catch (e) {}
            resolve(status)
        }

        // timeout: no response = filtered
        const timer = setTimeout(() => finish("filtered"), timeout)

        // listen for incoming TCP responses
        socket.on("message", (buf, source) => {
            // skip packets not from target or too short
            if (source !== ip) return
            if (buf.length < 20 || buf[9] !== 6) return
            // parse IP header length, then TCP header
            const ihl = (buf[0] & 0x0f) * 4
            if (buf.length < ihl + 20) return
            // verify response matches our probe
            if (buf.readUInt16BE(ihl) !== port) return           // source port = target port
            if (buf.readUInt16BE(ihl + 2) !== srcPort) return    // dest port = our source port
            // check TCP flags
            const flags = buf[ihl + 13]
            if ((flags & 0x12) === 0x12) {
                // open: build RST to tear down the half-open connection
                const rst = Buffer.alloc(20)
                rst.writeUInt16BE(srcPort, 0)                  // source port
                rst.writeUInt16BE(port, 2)                     // destination port
                rst.writeUInt32BE(buf.readUInt32BE(ihl + 8), 4) // seq = ack from SYN/ACK
                rst.writeUInt32BE(0, 8)                        // ack number = 0
                rst.writeUInt8(0x50, 12)                       // data offset = 5 (20 bytes)
                rst.writeUInt8(0x04, 13)                       // flags = RST
                rst.writeUInt16BE(0, 14)                       // window size
                rst.writeUInt16BE(0, 16)                       // checksum (computed below)
                rst.writeUInt16BE(0, 18)                       // urgent pointer = 0
                raw.writeChecksum(rst, 16, raw.createChecksum(pseudoHeader, rst))
                // send RST, then report open
                socket.send(rst, 0, rst.length, ip, () => finish("open"))
            }
            else if (flags & 0x04) finish("closed")          // RST = closed
        })

        // send SYN packet to target
        socket.send(tcpHeader, 0, tcpHeader.length, ip, (err) => {
            if (err) finish("filtered")
        })
    })
}
