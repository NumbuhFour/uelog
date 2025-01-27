
import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { GetAllTabsForFile } from "./DockUtils";

import { IoMdReturnRight } from "react-icons/io";
import { LogViewerLineRender } from "./LogViewerLine";


export const BookmarksWindow = ( { allFiles, GetDockLayout, SetBookmark }) => {

    console.log("BOOKMARK FILES", allFiles)


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


    const config = {
        showLineNumber: false
    }

    const getConfig = (attr, def=true) => {
        if (!config) return def;
        if (attr in config) return config[attr]
        return def;
    }


    return (<>
    <h2> Bookmarks </h2>
    <hr />
    {
        Object.keys(allFiles).filter(filename => Object.keys(allFiles[filename].bookmarks).length > 0)
        .map(filename => {
            const file = allFiles[filename];
            return (<>
                <h3> {filename} </h3>
                <div className="bookmarklist">
                    { Object.keys(file.bookmarks).map(line => {
                        const bookmark = file.bookmarks[line]
                        return (<>
                            <div>
                                <span>{line}: </span><input type="text" value={bookmark.message} onChange={(e)=>UpdateText(filename, line, e.target.value)}></input>
                                <a onClick={()=>JumpToBookmark(filename, line)}> <IoMdReturnRight /></a>
                                <div><LogViewerLineRender getConfig={getConfig} contentParts={file.lines[line]}/></div>
                            </div>
                        </>)
                    }) }
                </div>
            </>)
        })
    }
    </>)
}