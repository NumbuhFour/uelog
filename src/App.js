import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import {DockLayout} from 'rc-dock';
import { LogViewerPage } from './editor/LogViewerPage';
import { parseLine } from "./editor/Parser";
import { LogViewerHeader } from "./editor/LogViewerHeader";
import "./App.scss";

import "./editor/LogViewer.scss";
import { AllFilesContext, DockLayoutContext, GlobalConfigContext, MyFilesContext } from "./GlobalContext";
import { GetPanelForTab } from "./editor/DockUtils";


let groups = {
  'default': {
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
      old[file.name] = {
        name: file.name,
        lines: parsedLines,
        nextId: 0,
      };
      return old;
    })
  }
  const UpdateFile = (file, parsedLines) => {

    setFileCollection(old => {
      const prevEntry = old[file.name]
      prevEntry.lines = parsedLines;
      old[file.name] = prevEntry;
      return old;
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


  const makeLogTab = (fileName) => {
    const file = fileCollection[fileName];
    
    const id = file.name + "_" + file.nextId;
    const tab = {
      id: id,
      title: file.name,
      file: file.name,
      closable: true,
      cached: true,
      content: (
        <DockLayoutContext.Provider value={dockLayoutRef.current}>
          <AllFilesContext.Provider value={fileCollection}>
            <LogViewerPage file={fileName} id={id} 
              extraMenus={
                [
                  {
                    title: "Split",
                    onClick: ()=>{
                      splitTab(fileName, id)
                    }
                  }
                ]
              }
            />
          </AllFilesContext.Provider>
        </DockLayoutContext.Provider>
      ),
      group: "default",
    }

    file.nextId++;
    return tab;
  }

  const splitTab = (fileName, tabId) => {
    const tab = makeLogTab(fileName);

    dockLayoutRef.current.dockMove(tab, tabId, "after-tab")
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
          <DockLayout ref={dockLayoutRef} dropMode={globalConfig.dragEdges ? 'edge':''} defaultLayout={defaultLayout} groups={groups}/>
      </GlobalConfigContext.Provider>
    </div>

    </>
  );
}

export default App;
