import { useRef } from "react";
import { RenderDeltaTime } from "./LogViewerLine";
import "./SavePrompt.scss"

export const SavePrompt = (props) => {

    const root = useRef(null);

    const GatherText = () => {
        const save_omissions = root.current.querySelector('#save_omissions').checked;
        const save_numbers = root.current.querySelector('#save_numbers').checked;
        const save_timestamp = root.current.querySelector('#save_timestamp').checked;
        const save_timestamp_start = root.current.querySelector('#save_timestamp_start').checked;
        const save_frame = root.current.querySelector('#save_frame').checked;
        const save_category = root.current.querySelector('#save_category').checked;
        const save_verbosity = root.current.querySelector('#save_verbosity').checked;

        let out = []
        props.lines.forEach(l => {
            if (l.type == "concat" && save_omissions) {
                out.push(` - ${l.numlines} lines omitted -`)
            }
            else if (l.type == "line") {
                let line = ""
                if (save_numbers) line += `${l.number}\t`
                if (save_timestamp && l.timestamp) {
                    line += `[${save_timestamp_start ? RenderDeltaTime(l.timefromstart) : l.timestamp}] `
                }
                if (save_frame && l.frame) line += `[${l.frame}] `
                if (save_category) line += `${l.category}: `
                if (save_verbosity) line += `${l.verbosity}: `
                line += `${l.message}`
                out.push(line)
            }
        })
        console.log(props.lines)
        console.log(out.join('\n'))
        return out.join('\n')
        
    }

    const onSaveToFile = () => {
        const text = GatherText();
        
        var fileName = `filtered_${props.fileName}`;
        var myFile = new Blob([text], {type: 'text/plain'});

        window.URL = window.URL || window.webkitURL;

        // Create a temporary anchor element to trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(myFile);
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(downloadLink.href);
    }

    const onSaveToClipboard = () => {
        const text = GatherText();
        navigator.clipboard.writeText(text);
    }

    return (
        <div ref={root} className="save-prompt">
            <div className="options-container">
                <div className="option-row">
                    <span>Include Omissions:</span>
                    <input id="save_omissions" type="checkbox" defaultChecked/>
                </div>
                <div className="option-row">
                    <span>Include Line Numbers:</span>
                    <input id="save_numbers" type="checkbox"/>
                </div>
                <div className="option-row">
                    <span>Include Timestamp:</span>
                    <input id="save_timestamp" type="checkbox"/>
                </div>
                <div className="option-row">
                    <span>Timestamp as Time from Start:</span>
                    <input id="save_timestamp_start" type="checkbox" defaultChecked/>
                </div>
                <div className="option-row">
                    <span>Include Frame:</span>
                    <input id="save_frame" type="checkbox"/>
                </div>
                <div className="option-row">
                    <span>Include Log Categories:</span>
                    <input id="save_category" type="checkbox" defaultChecked/>
                </div>
                <div className="option-row">
                    <span>Include Log Verbosity:</span>
                    <input id="save_verbosity" type="checkbox"/>
                </div>
            </div>
            
            <div className="buttons-container">
                <button id="savebtn" onClick={onSaveToFile}>Save to File</button>
                <button onClick={onSaveToClipboard}>Save to Clipboard</button>
            </div>
        </div>
    )
};

export const MakeSavePromptWindow = (dockLayoutContext, lines, fileName) => {
    let tab = {
      id: "prompt",
      title: "Save",//file.name,
      closable: true,
      cached: true,
      content: <SavePrompt lines={lines} fileName={fileName}/>,
      group: "modal",
    }
    dockLayoutContext.dockMove(tab, null, "float")
}