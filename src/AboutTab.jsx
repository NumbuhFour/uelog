
import ReactMarkdown from 'react-markdown'
import { AppVersion } from './Constants';


const markdown = `
# About
This is a pretty simple log viewer tool for Unreal Engine logs.

Open a file with **File > Open...** in the top left.

Split a file for comparison with the **Split** option in the log window.

Version v${AppVersion}

[Github](https://github.com/NumbuhFour/uelog)

## Features
- Multi-window for multiple filters or logs
- Synced scrolling with adjacent filtered views
- View timestamp as time since app start
- Bookmark lines and write comments on them
- Save, copy, and load filters
- All local - nothing is uploaded or sent anywhere. Everything stays in your browser

## Changelog

*2/8/2025 v0.2.0*
- Add ability to open multiple files
- Add ability to open Annotated files with the regular "open" option (with warning)
- Add highlighting lines when jumping from bookmark
- Add a prototype search box (its a little jank)
- Fix regex search

`;

export const AboutTab = () => {
    return (<div style={{padding: "0px 20px"}}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>)
}