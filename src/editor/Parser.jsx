
const LineRe = /^(?:\[(?<timestamp>\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d{3})\]\[\s{0,3}(?<frame>\d{1,3})\])?(?:(?<category>\S+): )?(?:(?<verbosity>Fatal|Error|Warning|Display|Log|Verbose|VeryVerbose): )?(?<message>.+)$/

export function parseLine (line, ind) {
    line = line.trim()
    const groups = LineRe.exec(line)?.groups
    return {
        timestamp: groups?.timestamp,
        frame: groups?.frame,
        category: groups?.category,
        verbosity: groups?.verbosity,
        message: groups?.message,
        fulltext: line,
        linenumber: ind+1,
        parseSuccess: groups != undefined || line == '',
    }
}