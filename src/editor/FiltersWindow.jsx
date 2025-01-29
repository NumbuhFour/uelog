
import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { GetAllTabsForFile } from "./DockUtils";

import { IoMdReturnRight } from "react-icons/io";
import { LogViewerLineRender } from "./LogViewerLine";
import { FaCopy, FaTrash } from "react-icons/fa";
import { AllFilesContext, SavedFiltersContext } from "../GlobalContext";
import { toast } from "react-toastify";


export const FiltersWindow = ( { GetDockLayout, SetBookmark }) => {

    const {allFiles, setAllFiles} = useContext(AllFilesContext)
    const [savedFilters, setSavedFilters, OpenFiltersTab] = useContext(SavedFiltersContext)



    const UpdateText = (filename, line, text) => {
        let bookmark = allFiles[filename].bookmarks[line]
        bookmark.message = text;
        SetBookmark(filename, line, bookmark)
    }

    const JumpToBookmark = (filename, line) => {
    console.log("BOOKMARK JUMP", line)
    const tabs = GetAllTabsForFile(GetDockLayout().getLayout(), filename);
        tabs.forEach(tab => {
            if (tab.NeighborScroll)
                tab.NeighborScroll(allFiles[filename].lines[line])
        })
    }

    const RemoveBookmark = (filename, line) => {
        console.log("Remove bookmark", filename, line)
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

    const CopyFilter = (filter) => {
        console.log("Copy click!", JSON.stringify(filter))
        navigator.clipboard.writeText(JSON.stringify(filter))
        toast("Copied!")
    }

    const UpdateTitle = (filter, title) => {
        
        setSavedFilters(old => {
            console.log("UPD TITLE", old)
            const update = old.map(iter => {
                if (iter.guid == filter.guid) {
                    iter.title = title
                }

                return iter
            })
            return update
        })
    }
    const UpdateDescription = (filter, description) => {
        setSavedFilters(old => {
            const update = old.map(iter => {
                if (iter.guid == filter.guid) {
                    iter.description = description
                }
                
                return iter
            })
            return update
        })
    }
    const RemoveFilter = (filter) => {

    }


    return (<div className="toolwindow filtersWindow">
    <h2> Saved Filters </h2>
    <hr />
    {

        savedFilters.map(filter => (
            <div className="entry" key={filter.guid}>
                <div className="info">
                    
                    <div>
                        <a title="Copy Filter" className="smbtn copy" onClick={()=>CopyFilter(filter)}> <FaCopy /></a>
                        <input type="text" placeholder="Title" value={filter.title} onChange={(e)=>UpdateTitle(filter, e.target.value)}></input>
                        <a title="Remove Filter" className="smbtn remove" onClick={()=>RemoveFilter(filter)}> <FaTrash /></a>
                    </div>
                    {/*<div>
                        <input type="description" placeholder="Description" value={filter.description} onChange={(e)=>UpdateDescription(filter, e.target.value)}></input>
                    </div>*/}
                    
                </div>
            </div>
        ))

        /*Object.keys(allFiles).filter(filename => Object.keys(allFiles[filename].bookmarks).length > 0)
        .map(filename => {
            const file = allFiles[filename];
            return (<div className="section" key={filename}>
                <h3> {filename} </h3>
                <div className="filterslist">
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
            </div>)
        })*/
    }
    </div>)
}