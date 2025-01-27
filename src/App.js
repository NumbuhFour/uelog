import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import {DockLayout} from 'rc-dock';
import { LogViewerPage } from './editor/LogViewerPage';
import { parseLine } from "./editor/Parser";
import { LogViewerHeader } from "./editor/LogViewerHeader";
import "./App.scss";

import "./editor/LogViewer.scss";
import { AllFilesContext, BookmarkFunctionsContext, DockLayoutContext, GlobalConfigContext, MyFilesContext } from "./GlobalContext";
import { GetAllTabsForFile, GetPanelForTab } from "./editor/DockUtils";
import { BookmarksWindow } from "./editor/BookmarksWindow";

import { ToastContainer, toast } from 'react-toastify';


let groups = {
  'default': {
    floatable: true,
    tabLocked: false,
    closable: true,
    newWindow: true,
    maximizable: true,
  },
  'windows': {
    floatable: true,
    tabLocked: false,
    closable: true,
    newWindow: true,
    maximizable: true,
  }
};
const GlobalConfigDefault = {
  showLineNumber: true,
  showTimestamp: true,
  timestampAsDelta: false,
  showFrame: true,
  dragEdges: false,
  colorCategories: true,
  contrastMessage: true,
}


function App() {
  const dockLayoutRef = useRef(null);
  let configDefault = GlobalConfigDefault
  const existingConfig = JSON.parse(localStorage.getItem('storedConfig'))
  if (existingConfig) configDefault = existingConfig;
  const [globalConfig, setGlobalConfig] = useState(configDefault)
  const inputRef = useRef(null);
  const [lastDirectory, setLastDirectory] = useState('');


  const [fileCollection, setFileCollection] = useState({})

  const AddFile = (file, parsedLines)  => {
    setFileCollection(old => {
      const newData = {...old}
      newData[file.name] = {
        name: file.name,
        lines: parsedLines,
        nextId: 0,
        bookmarks: {},
      };
      old[file.name] = newData[file.name]
      return newData;
    })
  }
  const UpdateFile = (file, parsedLines) => {

    setFileCollection(old => {
      const newData={...old}
      newData[file.name].lines = parsedLines
      old[file.name].lines = parsedLines
      return newData;
    })
  }

  const FileExists = (fileName) => {
    return fileName in fileCollection
  }

  const setConfigAttribute = (attribute, value) => {
    setGlobalConfig(prevConfig => 
    {
      var out = {...prevConfig }
      out[attribute] = value;
      return out
    })
  }
  useEffect(() => {
    localStorage.setItem('storedConfig', JSON.stringify(globalConfig));
    console.log("update conifg", localStorage.getItem('storedConfig'))
  }, [globalConfig]);

  // Grab the directory used last time, saved to local storage
  useEffect(() => {
    const storedDirectory = localStorage.getItem('lastDirectory');
    if (storedDirectory) {
      setLastDirectory(storedDirectory);
    }
    
    const storedConfig = localStorage.getItem('storedConfig');
    if (storedConfig) {
      setGlobalConfig(JSON.parse(storedConfig));
    }
  }, []);

  const updateFile = (filename, value) => {
    setFileCollection(old => {
      const newData = {...old}
      newData[filename] = value;
      old[filename] = value;
      return newData;
    })
  }


  const makeLogTab = (fileName) => {
    const file = fileCollection[fileName];
    console.log("MAKING TAB FOR FILE", file)
    
    const id = file.name + "||" + Math.random() + "||" + file.nextId;
    const tab = {
      id: id,
      title: file.name,
      file: file.name,
      closable: true,
      cached: true,
      content: (
        <DockLayoutContext.Provider value={dockLayoutRef.current}>
            <LogViewerPage file={fileName} id={id} 
              extraMenus={
                [
                  { 
                    title: "Split",
                    items: [
                      { label: 'Right', action: ()=> splitTab(fileName, id, 'right')}, 
                      { label: 'Left', action: ()=> splitTab(fileName, id, 'left')}, 
                      { label: 'Up', action: ()=> splitTab(fileName, id, 'up')}, 
                      { label: 'Down', action: ()=> splitTab(fileName, id, 'down')}, 
                      { label: 'After', action: ()=> splitTab(fileName, id, 'after-tab')}, 
                      { label: 'Before', action: ()=> splitTab(fileName, id, 'before-tab')}, 
                    ]
                  }
                ]
              }
            />
        </DockLayoutContext.Provider>
      ),
      group: "default",
    }
    console.log("MAKE LOG TAB: ", id)

    setFileCollection(old => {
      const newData = {...old}
      newData[fileName].nextId++
      console.log("ID UPDATE GEEZ", newData[fileName].nextId)
      return newData
    })

    return tab;
  }

  const splitTab = (fileName, tabId, mode="Down") => {
    const tab = makeLogTab(fileName);


    console.log("Splitting", tab, tabId)
    if (['after-tab', 'before-tab'].includes(mode)) {
      dockLayoutRef.current.dockMove(tab, tabId, mode)
    }
    else {
      const owner = GetPanelForTab(dockLayoutRef.current.getLayout(), tabId)
      dockLayoutRef.current.dockMove(tab, owner, mode)
    }
  }

  const addTabForFile = (fileName) => {
    const tab = makeLogTab(fileName);

    dockLayoutRef.current.dockMove(tab, dockLayoutRef.current.getLayout().dockbox, "middle")
  }

  const handleFileOpen = (event) => {
    const file = event.target.files[0];
    if (file) {

      // Update last-used directory
      if (file.webkitRelativePath) {
        const directory = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
        setLastDirectory(directory);
        localStorage.setItem('lastDirectory', directory);
      }
      
      // Open file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        let earliestTime = undefined
        const linesArray = text.split("\n").map((line, ind) => {
          const out = parseLine(line, ind, earliestTime)
          if (out.datetime && !earliestTime) {
            earliestTime = out.datetime
          }
          return out
        });
        
        if (FileExists(file.name)) {
          UpdateFile(file, linesArray);
          addTabForFile(file.name);
        }
        else {
          AddFile(file, linesArray)
          addTabForFile(file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const SetBookmark = (filename, line, data) => {
    let file = fileCollection[filename];
    file.bookmarks[line] = data;
    updateFile(filename, file)
    const tabs = GetAllTabsForFile(dockLayoutRef.current.getLayout(), filename);
    tabs.forEach(i => {
      if (i?.forceUpdate)
        i.forceUpdate()
    })
  }
  useEffect(() => {
    OpenBookmarkTab(true)
  }, [fileCollection])

  const OpenBookmarkTab = (keepClosed=false) => {
    const existing = dockLayoutRef.current.find('window_bookmark');
    const newtab = {
      id: 'window_bookmark',
      title: "Bookmarks",
      closable: true,
      content: (
        <AllFilesContext.Consumer>
          {({allFiles, setAllFiles}) => (
            <BookmarksWindow allFiles={allFiles} GetDockLayout={()=>dockLayoutRef.current} SetBookmark={SetBookmark}/>
          )}
        </AllFilesContext.Consumer>
      ),
      group: "windows",
    }
    if (existing) {
      //dockLayoutRef.current.updateTab('window_bookmark', newtab)
    }
    else if (!keepClosed){
      dockLayoutRef.current.dockMove(newtab, dockLayoutRef.current.getLayout().dockbox, 'right')
    }
  }

  const OpenAddBookmark = (filename, line) => {
    console.log("Add bookmark", filename, line)
    SetBookmark(filename, line, {
      message: "Bookmark"
    })
    OpenBookmarkTab();
  }

  const OpenBookmark = (filename, line) => {
    console.log("Open bookmark", filename, line)
    OpenBookmarkTab();
  }


  // Drop-down menu config
  const menuConfig = [
    {
      title: "File",
      items: [
        { label: "Open...", action: () => {
          const fileInput = document.querySelector('#fileInput');
          if (lastDirectory) {
            fileInput.setAttribute("webkitDirectory", lastDirectory)
          }
          fileInput.click() 
        }
      },
      ],
    },
    {
      title: "Config",
      items: [
        { label: <span>{globalConfig.dragEdges ? "☑":"☐"} Drag To Edges </span>, action: () => { setConfigAttribute('dragEdges', !globalConfig.dragEdges); return true; } },
        { label: <span>{globalConfig.showLineNumber ? "☑":"☐"} Show Line Numbers</span>, action: () => { setConfigAttribute('showLineNumber', !globalConfig.showLineNumber); return true; } },
        { label: <span>{globalConfig.showTimestamp ? "☑":"☐"} Show Timestamp</span>, action: () => { setConfigAttribute('showTimestamp', !globalConfig.showTimestamp); return true; } },
        { label: <span>{globalConfig.timestampAsDelta ? "☑":"☐"} Timestamp as from Start</span>, action: () => { setConfigAttribute('timestampAsDelta', !globalConfig.timestampAsDelta); return true; } },
        { label: <span>{globalConfig.showFrame ? "☑":"☐"} Show Frame Numbers</span>, action: () => { setConfigAttribute('showFrame', !globalConfig.showFrame); return true; } },
        { label: <span>{globalConfig.colorCategories ? "☑":"☐"} Color Categories </span>, action: () => { setConfigAttribute('colorCategories', !globalConfig.colorCategories); return true; } },
        { label: <span>{globalConfig.contrastMessage ? "☑":"☐"} Contrast Message</span>, action: () => { setConfigAttribute('contrastMessage', !globalConfig.contrastMessage); return true; } },
      ],
    },
    {
      title: "Windows",
      items: [
        { label: <span> Bookmarks </span>, action: () => { OpenBookmarkTab(); } },
      ],
    },
  ];

  const defaultLayout = {
    dockbox: {
      mode: 'horizontal',
      id: "default_panel",
      children: []
    }
  };

  return (
    <>
    <input ref={inputRef} webkitdirectory id="fileInput" type="file" accept="text/*" style={{ display: 'none' }} onChange={handleFileOpen} />
    <LogViewerHeader menuConfig={menuConfig} />

    <div className="tabContainer">
        <GlobalConfigContext.Provider value={globalConfig}>
          <BookmarkFunctionsContext.Provider value={{OpenAddBookmark, OpenBookmark}}>
            <AllFilesContext.Provider value={{allFiles:fileCollection, setAllFiles:setFileCollection}}>
              <DockLayout ref={dockLayoutRef} dropMode={globalConfig.dragEdges ? 'edge':''} defaultLayout={defaultLayout} groups={groups}/>
            </AllFilesContext.Provider>
          </BookmarkFunctionsContext.Provider>
      </GlobalConfigContext.Provider>
    </div>
    <ToastContainer position="bottom-right" draggable theme="dark"/>
    </>
  );
}

export default App;
