import dgram from "node:dgram"
import getPayload from "./payloads.js"

// perform an UDP scan on a port
export default function udpScan(ip, port, timeout) {
    let result = new Promise((resolve) => {
        // create socket and connect to IP address
        const socket = dgram.createSocket("udp4")
        socket.connect(port, ip, () => socket.send(getPayload(port)))
        // report port status based on the event
        const timer = setTimeout(() => {
            socket.close()
            resolve("open|filtered")
        }, timeout)
        socket.on("message", () => {clearTimeout(timer); socket.close(); resolve("open")})
        socket.on("error", (err) => {
            clearTimeout(timer)
            socket.close()
            // ICMP port unreachable -> closed; other ICMP unreachable -> filtered
            resolve(err.code === "ECONNREFUSED" ? "closed" : "filtered")
        })
    })
    return result
}