
import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { GetAllTabsForFile } from "./DockUtils";

import { IoMdReturnRight } from "react-icons/io";
import { LogViewerLineRender } from "./LogViewerLine";
import { FaTrash } from "react-icons/fa";
import { AllFilesContext } from "../GlobalContext";
import Collapsible from "../Collapsible";


export const BookmarksWindow = ( { GetDockLayout, SetBookmark }) => {

    const {allFiles, setAllFiles} = useContext(AllFilesContext)



    const UpdateText = (filename, line, text) => {
        let bookmark = allFiles[filename].bookmarks[line]
        bookmark.message = text;
        SetBookmark(filename, line, bookmark)
    }

    const JumpToBookmark = (filename, line) => {
        const tabs = GetAllTabsForFile(GetDockLayout().getLayout(), filename);
        tabs.forEach(tab => {
            if (tab.NeighborScroll)
                tab.NeighborScroll(allFiles[filename].lines[line])
        })
    }

    const RemoveBookmark = (filename, line) => {
        setAllFiles(old => {
            const newData = {...old};
            delete newData[filename].bookmarks[line]
            return newData
        })
    }


    const config = {
        showLineNumber: false,
        alternatingBackground: false,
        nohover: true,
        nobg:true,
    }

    const getConfig = (attr, def=true) => {
        if (!config) return def;
        if (attr in config) return config[attr]
        return def;
    }


    return (<div className="toolwindow bookmarksWindow">
    <h2> Bookmarks </h2>
    <hr />
    {
        Object.keys(allFiles).filter(filename => Object.keys(allFiles[filename].bookmarks).length > 0)
        .map(filename => {
            const file = allFiles[filename];
            return (<div className="section" key={filename}>
                <Collapsible title={filename}>
                <div className="bookmarklist">
                    { Object.keys(file.bookmarks).map(line => {
                        const bookmark = file.bookmarks[line]
                        return (<>
                            <div key={line.number} className="entry">
                                <div className="info">
                                    <span className="number">{line}: </span>
                                    <input type="text" value={bookmark.message} onChange={(e)=>UpdateText(filename, line, e.target.value)}></input>
                                    <a title="Remove bookmark" className="smbtn remove" onClick={()=>RemoveBookmark(filename, line)}> <FaTrash /></a>
                                </div>
                                <div className="preview">
                                <a title="Go to line" className="smbtn jump" onClick={()=>JumpToBookmark(filename, line)}> <IoMdReturnRight /></a>
                                    <a onClick={()=>JumpToBookmark(filename,line)}><LogViewerLineRender getConfig={getConfig} contentParts={file.lines[line-1]}/></a>
                                </div>
                            </div>
                        </>)
                    }) }
                </div>
                </Collapsible>
            </div>)
        })
    }
    </div>)
}