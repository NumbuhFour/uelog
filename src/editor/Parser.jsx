
import moment from 'moment';

const LineRe = /^(?:\[(?<timestamp>\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d{3})\]\[\s{0,3}(?<frame>\d{1,3})\])?(?:(?<category>\S+): )?(?:(?<verbosity>Fatal|Error|Warning|Display|Log|Verbose|VeryVerbose): )?(?<message>.+)$/

export function parseLine (line, ind, earliestTime) {
    line = line.trimRight()
    const groups = LineRe.exec(line)?.groups

    let datetime;
    let timefromstart=0;
    if (groups?.timestamp) {
        datetime = new Date(moment(groups.timestamp, "YYYY.MM.DD-HH.mm.ss:SSS"))
        if (earliestTime) {
            timefromstart = new Date(datetime) - new Date(earliestTime)
        }
        else {
            timefromstart = 0;
        }
    }

    return {
        type: "line",
        timestamp: groups?.timestamp,
        datetime: datetime,
        timefromstart: timefromstart,
        frame: groups?.frame,
        category: groups?.category,
        verbosity: groups?.verbosity,
        message: groups?.message,
        fulltext: line,
        linenumber: ind+1,
        parseSuccess: groups != undefined || line == '',
    }
}

//2024.12.23-05.51.55:420
//YYYY.MM.DD-HH.mm.ss:SSS