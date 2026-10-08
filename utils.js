import chalk from "chalk"

// function to show help message
export function showHelp() {
    const ORANGE = chalk.hex('#FFA500')
    const GREEN = chalk.green
    console.log(`${chalk.yellow.bold("Usage:")} node port_prowler.js ${ORANGE("<ip>")} ${chalk.yellow("[OPTIONS]")}`)
    console.log(`${GREEN.bold("EXAMPLE:")} node port_prowler.js 172.16.0.1 -p 20-25 -s -f scan_results.txt`)
    console.log(`
        ${chalk.yellow.bold("OPTIONS:")}
        ${GREEN("-p;--ports")} - Specify ports (single, multiple comma-separated or range)
        ${GREEN("-tcp")} - Perform a TCP scan
        ${GREEN("-udp")} - Perform an UDP scan
        ${GREEN("-s;--stealth")} - Perform a stealth scan(requires elevated privileges)
        ${GREEN("-f;--file")} - Save to an output file
        ${GREEN("-h;--help")} - Show help message
        `)
}

// parses ports into an array
export function parsePorts(ports) {
    if (!ports.includes(",") && !ports.includes("-")) {
        return [Number(ports)]
    }
    else if (ports.includes(",")) {
        return ports.split(",").map(p => Number(p))
    }
    else if (ports.includes("-")) {
        let [start, end] = ports.split("-").map(Number)
        let result = []
        for (let i = start; i <= end; i++) {
            result.push(i)
        }
        return result
    }
    else {
        return []
    }
}