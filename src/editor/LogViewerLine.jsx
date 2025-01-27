import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import * as ReactDOM from "react-dom";

import { CiBookmarkPlus  } from "react-icons/ci";
import { BsFillBookmarkPlusFill } from "react-icons/bs";
import { FaPlus, FaBookmark } from "react-icons/fa";
import { BookmarkFunctionsContext, MyFilesContext } from "../GlobalContext";
import { Tooltip } from "react-tooltip";

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

export const LogViewerLineRender = ({ key, myFile, getConfig, style, contentParts, BookmarkBtn}) => {


    return (
        <div key={key} className={[
                "line",
                GetVerbosityClass(contentParts.verbosity),
                getConfig('alternatingBackground', true) ? (contentParts.linenumber % 2 == 0 ? "even":"odd"):'',
                contentParts.type,
                getConfig('nohover', false) ? "nohover":"",
                getConfig('nobg', false) ? "nobg":"",
            ].join(' ')}
            style={style}>
            { contentParts.type == 'line' && (<>
                { BookmarkBtn }
                { getConfig('showLineNumber',true) && <span className="number"> {contentParts.linenumber} </span> }
                <a className="lineTooltip" data-tooltip-variant="light" data-tooltip-content={myFile?.bookmarks[contentParts.linenumber]?.message} data-tooltip-delay-show={670} >
                    { ((getConfig('showTimestamp',true) && contentParts.timestamp) || getConfig('debugLine',false)) && (
                        <span className={["timestamp", getConfig('contrastMessage', true)?'greyout':''].join(' ')}>[{getConfig('timestampAsDelta',true) ? RenderDeltaTime(contentParts.timefromstart) : contentParts.timestamp}]</span>
                        )}
                    { ((getConfig('showFrame',true) && contentParts.frame) || getConfig('debugLine', false)) && (<span className={["frame", getConfig('contrastMessage',true)?'greyout':''].join(' ')}>[{contentParts.frame?.trim().toString().padStart(3,' ')}]</span>)}
                    { ((contentParts.category) || getConfig('debugLine', false)) && (<><span style={getConfig('colorCategories',true) ? {color:generateColorFromLogCat(contentParts.category)}:{}} className={["category", getConfig('contrastMessage',true)?'greyout':'', contentParts.category].join(' ')}>{contentParts.category}: </span></>)}
                    { ((contentParts.verbosity) || getConfig('debugLine',false)) && (<><span className={["verbosity", contentParts.verbosity, getConfig('contrastMessage',true)?'greyout':''].join(' ')}>{contentParts.verbosity}: </span></>)}
                    { ((contentParts.message) || getConfig('debugLine',false)) && (<span className="message">{contentParts.message}</span>)}
                    { (!contentParts.parseSuccess) && (<span className="parseError"> [PARSE ERROR]: {JSON.stringify(contentParts.fulltext)} </span>)}
                </a>
            </>)}
            { contentParts.type == 'concat' && (<>
                <span className="text">
                    - {contentParts.numlines} lines omitted -
                </span>
            </>)}
        </div>
    );
}

export const LogViewerLine = ({ key, config, contentParts, style }) => {

    const { myFile, setMyFile } = useContext(MyFilesContext);
    const { OpenBookmark, OpenAddBookmark } = useContext(BookmarkFunctionsContext);

    const getConfig = (attr, def=true) => {
        if (!config) return def;
        if (attr in config) return config[attr]
        return def;
    }

    const Bookmark = () => {
        return (
            <span className={["bookmarkbtn", (contentParts.linenumber in myFile.bookmarks) ? 'present':'add'].join(' ')}> 
                {(()=>{
                    if (contentParts.linenumber in myFile.bookmarks)
                        return <a onClick={()=>OpenBookmark(myFile.name, contentParts.linenumber)}> <FaBookmark /> </a>
                    else
                    return <a onClick={()=>OpenAddBookmark(myFile.name, contentParts.linenumber)}> <FaPlus /> </a>
                })()}
            </span>
        )
    }

    return (
        <LogViewerLineRender key={key} myFile={myFile} style={style} getConfig={getConfig} BookmarkBtn={Bookmark()} contentParts={contentParts}/>
    )
};
