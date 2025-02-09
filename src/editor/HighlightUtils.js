

export const EHighlightModes = {
    NONE:               'NONE',               // Not highlighted
    SEARCH_NONFOCUS:    'SEARCH_NONFOCUS',    // Line is highlighted due to an active search, but it is not the currently-selected line
    SEARCH_FOCUS:       'SEARCH_FOCUS',       // Line is highlighted due to an active search and is the currently-selected line
    BOOKMARK:           'BOOKMARK',           // Line is highlighted due to a clicked bookmark
    SYNCHOVER:          'SYNCHOVER',          // Line is highlighted due to a sync-scroll hover
}


const MakeHighlightState = (line, file, mode) => {
    return {
        linenumber: (typeof line == "string") ? line:line.linenumber,
        filename: (typeof file === 'string') ? file : file.name,
        mode,
    }
}

const GetPriority = (mode) => Object.keys(EHighlightModes).indexOf(mode)


// returns the state of a highlight for a line
export const GetHighlightState = (highlights, line, file) => {
    if (file == undefined) return [];

    const filename = (typeof file === 'string') ? file : file.name
    let activeHighlights = highlights.filter((hl) => {
        if (hl.filename != filename) return false;

        if (hl.mode == EHighlightModes.SEARCH_NONFOCUS)
        {
            //if (line.fulltext.toLowerCase().indexOf(hl.linenumber.toLowerCase()) != -1) console.log('MATCH ', line) 
            return line.fulltext.toLowerCase().indexOf(hl.linenumber.toLowerCase()) != -1;
        }
        return hl.linenumber == line.linenumber && hl.filename == filename
    })

    activeHighlights = activeHighlights.sort((a,b) => (GetPriority(b.mode) - GetPriority(a.mode)))
    return activeHighlights;
}

export const GetHighlightClasses = (highlights, line, file) => {
    if (file == undefined) return "";

    const states = GetHighlightState(highlights, line, file);
    return states.map(e=>e.mode).join(' ');
}


// Marks a line as highlighted
// It may mutate the highlight list further based on the context
// ex. Only one bookmark can be highlighted at a time, so other lines highlighted by a bookmark are removed
export const AddHighlight = (highlights, setHighlights, line, file, mode) => {

    // Clear the category if we're adding an empty one for a mode
    if (line == '' || line == undefined) {
        
        const filename = (typeof file === 'string') ? file : file.name

        setHighlights((old) => {
            return old.filter(e => {
                if (e.filename != filename) return true;
                if (e.mode == mode || (mode == EHighlightModes.SEARCH_NONFOCUS && e.mode == EHighlightModes.SEARCH_FOCUS))
                    return false;
            })
        })
        return;
    }

    const made = MakeHighlightState(line, file, mode)

    // Don't add a dupe
    if (highlights.find(e => (e.mode == made.mode && e.filename == made.filename && e.linenumber == made.linenumber))) return;

    setHighlights((old) => {
        const update = old.filter((e) => {
            // These ones are exclusive, only have one
            if (mode == EHighlightModes.BOOKMARK || mode == EHighlightModes.SYNCHOVER || mode == EHighlightModes.SEARCH_FOCUS)
                return e.mode != mode

            // @TODO synchover should have only one per file
        })
        update.push(MakeHighlightState(line, file, mode))
        return update;
    })
}
export const RemoveHighlight = (highlights, setHighlights, line, file, mode) => {
    const filename = (typeof file === 'string') ? file : file.name
    setHighlights((old) => {
        return old.filter(e => {
            return e.linenumber == line.linenumber && e.filename == filename && e.mode == mode
        })
    })
}