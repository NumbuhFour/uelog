import * as React from "react";
import * as ReactDOM from "react-dom";

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

export const LogViewerLine = React.memo(({ config, contentParts }) => {

    return (
        <div className={[
                "line",
                GetVerbosityClass(contentParts.verbosity),
            ].join(' ')}
            style={{ display: "flex" }}>

            { config.showLineNumber && <span className="number"> {contentParts.linenumber} </span> }
            <span className="text">
                { ((config.showTimestamp && contentParts.timestamp) || config.debugLine) && (<>[<span className="timestamp">{contentParts.timestamp}</span>]</>)}
                { ((contentParts.frame) || config.debugLine) && (<>[<span className="frame">{contentParts.frame}</span>]</>)}
                { ((contentParts.category) || config.debugLine) && (<><span className={["category", contentParts.category].join(' ')}>{contentParts.category}</span>: </>)}
                { ((contentParts.verbosity) || config.debugLine) && (<><span className={["verbosity", contentParts.verbosity].join(' ')}>{contentParts.verbosity}</span>: </>)}
                { ((contentParts.message) || config.debugLine) && (<span className="message">{contentParts.message}</span>)}
                { (!contentParts.parseSuccess) && (<span className="parseError"> [PARSE ERROR]: {contentParts.fullText} </span>)}
            </span>
        </div>
    );
});
