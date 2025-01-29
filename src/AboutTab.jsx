
import ReactMarkdown from 'react-markdown'
import { AppVersion } from './Constants';


const markdown = `
# About
This is a pretty simple log viewer tool for Unreal Engine logs.

Open a file with **File > Open...** in the top left.

Split a file for comparison with the **Split** option in the log window.

Version v${AppVersion}

## Features
- Multi-window for multiple filters or logs
- Synced scrolling with adjacent filtered views
- View timestamp as time since app start
- Bookmark lines and write comments on them
- Save, copy, and load filters
- All local - nothing is uploaded or sent anywhere. Everything stays in your browser

`;

export const AboutTab = () => {
    return (<div style={{padding: "0px 20px"}}>
        <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>)
}