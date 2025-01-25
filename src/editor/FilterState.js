
export function MatchesFilter(contentParts, filter) {
    switch(filter.type) {
        case 'and':
            return filter.children.every(i => MatchesFilter(contentParts, i))
        case 'or':
            return filter.children.some(i => MatchesFilter(contentParts, i))
        case 'categoryIncludes':
            return contentParts.category?.toLowerCase().includes() == filter.value.toLowerCase()
        case 'textIncludes':
            return contentParts.fulltext?.toLowerCase().includes() == filter.value.toLowerCase()
        case 'textMatch': // Regex match full text
            return contentParts.fulltext.match(new RegExp(filter.value)) != null
        case 'messageIncludes':
            return contentParts.message?.toLowerCase().includes() == filter.value.toLowerCase()
    }
}

/*

root: {
    condition: { type: matchCategory, value: LogTemp }
}

*/