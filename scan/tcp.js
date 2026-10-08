import net from "node:net"

// performs a TCP connect scan on a port
export default function tcpScan(ip, port, timeout) {
    let result = new Promise((resolve) => {
        // establishes a connection
        const socket = net.createConnection(port, ip)
        socket.setTimeout(timeout)
        // reports port status based on what event occurs on each port
        socket.on('connect', () => {socket.destroy(); resolve("open")})
        socket.on('timeout', () => {socket.destroy(); resolve("filtered")})
        socket.on('error', () => resolve("closed"))
    })
    return result
}