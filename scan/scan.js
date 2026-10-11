import chalk from "chalk"
import tcpScan from "./tcp.js"
import udpScan from "./udp.js"
import stealthScan from "./stealth.js"

// a scanning function for all 3 scan types
export default async function scan(ip, ports, type) {
    let report = ""
    // iterate through each port
    if(type === "TCP") {
        for(let port of ports) {
            report += `Port ${port}: ${await tcpScan(ip, port, 2000)}\n`
        }
        return report
    }
    else if(type === "UDP") {
        for(let port of ports) {
            report += `Port ${port}: ${await udpScan(ip, port, 2000)}\n`
        }
        return report
    }
    else if(type === "Stealth") {
        for(let port of ports) {
            report += `Port ${port}: ${await stealthScan(ip, port, 2000)}\n`
        }
        return report
    }
    else {
        console.log(chalk.red.bold("Error: Incorrect or no argument passed to scan() 'type' parameter"))
        console.log("Options: 'tcp';'udp';'stealth'")
        process.exit(1)
    }
}