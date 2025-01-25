import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import {DockLayout} from 'rc-dock';
import { LogViewerPage } from './editor/LogViewerPage';
import { parseLine } from "./editor/Parser";
import { LogViewerHeader } from "./editor/LogViewerHeader";
import "./App.scss";

import "./editor/LogViewer.scss";
import { AllFilesContext, DockLayoutContext, GlobalConfigContext, MyFilesContext } from "./GlobalContext";


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
  showFrame: true,
}


function App() {
  const dockLayoutRef = useRef(null);
  const [globalConfig, setGlobalConfig] = useState(GlobalConfigDefault)
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

  // Grab the directory used last time, saved to local storage
  useEffect(() => {
    const storedDirectory = localStorage.getItem('lastDirectory');
    if (storedDirectory) {
      setLastDirectory(storedDirectory);
    }
  }, []);

  const addTabForFile = (fileName) => {
    const file = fileCollection[fileName];

    const tab = {
      id: file.name + "_" + file.nextId,
      title: file.name,
      closable: true,
      content: (
        <DockLayoutContext.Provider value={dockLayoutRef.current}>
          <AllFilesContext.Provider value={fileCollection}>
            <LogViewerPage file={fileName} id={file.name + "_" + file.nextId} 
              extraMenus={
                [
                  {
                    title: "Split",
                    onClick: ()=>{
                      addTabForFile(fileName)
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

    dockLayoutRef.current.dockMove(tab, "default_panel", "middle")
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
        const linesArray = text.split("\n").map((line, ind) => parseLine(line, ind));
        
        if (FileExists(file.name)) {
          UpdateFile(file, linesArray);
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
        { label: <span>{globalConfig.showLineNumber ? "☑":"☐"} Show Line Numbers</span>, action: () => { setConfigAttribute('showLineNumber', !globalConfig.showLineNumber); return true; } },
        { label: <span>{globalConfig.showTimestamp ? "☑":"☐"} Show Timestamp</span>, action: () => { setConfigAttribute('showTimestamp', !globalConfig.showTimestamp); return true; } },
        { label: <span>{globalConfig.showFrame ? "☑":"☐"} Show Frame Numbers</span>, action: () => { setConfigAttribute('showFrame', !globalConfig.showFrame); return true; } },
      ],
    },
  ];

  const defaultLayout = {
    dockbox: {
      mode: 'vertical',
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
          <DockLayout ref={dockLayoutRef} defaultLayout={defaultLayout} groups={groups}/>
      </GlobalConfigContext.Provider>
    </div>

    </>
  );
}

export default App;
