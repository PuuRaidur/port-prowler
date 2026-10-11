import fs from "node:fs"
import net from "node:net"
import chalk from "chalk"
import {showHelp, parsePorts} from "./utils.js"
import scan from "./scan/scan.js"

const ARGS = process.argv
if (!ARGS[2] || ARGS[2].startsWith("-h") || ARGS[2].startsWith("--help")) {
    showHelp()
    process.exit(0)
}

const IP = ARGS[2]
let ports
let scanTypes = []
let file

// Checks IP validity
if (IP.startsWith("-")) {
    console.log(chalk.red.bold("Error: IP address must be present"))
    showHelp()
    process.exit(1)
}
else if (net.isIP(IP) !== 4) {
    console.log(chalk.red.bold("Error: Invalid IP address (IPv4 required)"))
    showHelp()
    process.exit(1)
}

// Parsing arguments
for (let i = 3; i < ARGS.length; i++) {
    if (!ARGS[i].startsWith("-")) {
        continue
    }
    else if (ARGS[i].startsWith("-h") || ARGS[i].startsWith("--help")) {
        showHelp()
        process.exit(0)
    }
    else if (ARGS[i].startsWith("-p") || ARGS[i].startsWith("--ports")) {
        if (ARGS.length === i+1 || ARGS[i+1].startsWith("-")) {
            console.log(chalk.red.bold("Error: -p requires port value(s)"))
            showHelp()
            process.exit(1)
        }
        ports = parsePorts(ARGS[i+1])
    }
    else if (ARGS[i].startsWith("-tcp")) {
        scanTypes.push("TCP")
    }
    else if (ARGS[i].startsWith("-udp")) {
        scanTypes.push("UDP")
    }
    else if (ARGS[i].startsWith("-s") || ARGS[i].startsWith("--stealth")) {
        scanTypes.push("Stealth")
    }
    else if (ARGS[i].startsWith("-f") || ARGS[i].startsWith("--file")) {
        if (ARGS.length === i+1 || ARGS[i+1].startsWith("-")) {
            console.log(chalk.red.bold("Error: -f requires a filename value"))
            showHelp()
            process.exit(1)
        }
        file = ARGS[i+1]
    }
    else {
        console.log(chalk.red.bold("Error: incorrect utility usage"))
        showHelp()
        process.exit(1)
    }
}

// Checks post-parse validity
if (ports === undefined || ports.length === 0 || ports.some(p => !Number.isInteger(p) || p < 0 || p > 65535)) {
    console.log(chalk.red.bold("Error: incorrect port arguments"))
    showHelp()
    process.exit(1)
}
else if (scanTypes.length === 0) {
    scanTypes.push("TCP")
}

// perform scan techniques
const scans = scanTypes.map(type => {
    if (type === "TCP") {
        console.log(chalk.green.bold(`Scanning ${IP}(TCP)...`))
        return scan(IP, ports, "TCP").then(result => `TCP scan:\n${result}`)
    }
    if (type === "UDP") {
        console.log(chalk.green.bold(`Scanning ${IP}(UDP)...`))
        return scan(IP, ports, "UDP").then(result => `UDP scan:\n${result}`)
    }
    if (type === "Stealth") {
        console.log(chalk.green.bold(`Scanning ${IP}(Stealth)...`))
        return scan(IP, ports, "Stealth").then(result => `Stealth scan:\n${result}`)
    }
})
let scanResults = await Promise.all(scans)
// format scan results
scanResults = scanResults.join("\n")
console.log(scanResults)

// get exact timestamp
const now = new Date()
const pad = (n) => String(n).padStart(2, "0")
const timestamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}_${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

// write scan results to a file
if(file !== undefined) {
    fs.appendFile(file, `Port scan report at ${timestamp}:\n${scanResults}\n`, 'utf8', (err) => {
        if (err) throw err
        console.log(chalk.green.bold(`Scan report written to file: ${file}`))
    })
}