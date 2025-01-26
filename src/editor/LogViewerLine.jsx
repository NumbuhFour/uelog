import * as React from "react";
import * as ReactDOM from "react-dom";

function generateColorFromLogCat(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
  
    // Ensure color is not too dark
    let rgb = [
      parseInt(color.substr(1, 2), 16),
      parseInt(color.substr(3, 2), 16),
      parseInt(color.substr(5, 2), 16)
    ];
  
    while (rgb[0] + rgb[1] + rgb[2] < 384) { // Adjust 384 for desired brightness
      for (let i = 0; i < 3; i++) {
        rgb[i] = Math.min(rgb[i] + 32, 255); // Increase each component by 32
      }
    }
  
    return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }

const BadVerbosity = {
    Fatal: "lineFatal",
    Error: "lineError",
    Warning: "lineWarning",
};

function GetVerbosityClass(verb) {
    if (!verb) return "";
    const rtn = BadVerbosity[verb];
    return rtn ? rtn : "";
}

function RenderDeltaTime(delta) {


    const ms = delta % 1000;
    const s = Math.floor(delta / 1000) % 60
    const m = Math.floor(delta / (1000*60)) % 60
    const h = Math.floor(delta / (1000*60*60)) % 24
    const d = Math.floor(delta / (1000*60*60*24))

    let out = (h+"").padStart(2,0) + ":" + (m+"").padStart(2,0) + ":" + (s+"").padStart(2,0) + ":" + (ms+"").padStart(3,0);
    if (d > 0) {
        out = d + " - " + out;
    }

    return out;
}

export const LogViewerLine = ({ config, contentParts, style }) => {

    return (
        <div className={[
                "line",
                GetVerbosityClass(contentParts.verbosity),
                contentParts.linenumber % 2 == 0 ? "even":"odd",
                contentParts.type,
            ].join(' ')}
            style={style}>
            { contentParts.type == 'line' && (<>
                { config.showLineNumber && <span className="number"> {contentParts.linenumber} </span> }
                <span className="text">
                    { ((config.showTimestamp && contentParts.timestamp) || config.debugLine) && (
                        <span className={["timestamp", config.contrastMessage?'greyout':''].join(' ')}>[{config.timestampAsDelta ? RenderDeltaTime(contentParts.timefromstart) : contentParts.timestamp}]</span>
                        )}
                    { ((config.showFrame && contentParts.frame) || config.debugLine) && (<span className={["frame", config.contrastMessage?'greyout':''].join(' ')}>[{contentParts.frame?.trim().toString().padStart(3,' ')}]</span>)}
                    { ((contentParts.category) || config.debugLine) && (<><span style={config.colorCategories ? {color:generateColorFromLogCat(contentParts.category)}:{}} className={["category", config.contrastMessage?'greyout':'', contentParts.category].join(' ')}>{contentParts.category}: </span></>)}
                    { ((contentParts.verbosity) || config.debugLine) && (<><span className={["verbosity", contentParts.verbosity, config.contrastMessage?'greyout':''].join(' ')}>{contentParts.verbosity}: </span></>)}
                    { ((contentParts.message) || config.debugLine) && (<span className="message">{contentParts.message}</span>)}
                    { (!contentParts.parseSuccess) && (<span className="parseError"> [PARSE ERROR]: {JSON.stringify(contentParts.fulltext)} </span>)}
                </span>
            </>)}
            { contentParts.type == 'concat' && (<>
                <span className="text">
                    - {contentParts.numlines} lines omitted -
                </span>
            </>)}
        </div>
    );
};
