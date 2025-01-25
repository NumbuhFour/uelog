import React, { useState, useEffect, useRef } from "react";
import {DockLayout} from 'rc-dock';
import { LogViewerPage } from './editor/LogViewerPage';
import { parseLine } from "./editor/Parser";
import { LogViewerHeader } from "./editor/LogViewerHeader";
import "./App.scss";

import "./editor/LogViewer.scss";


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
}

function App() {
  const dockLayoutRef = useRef(null);
  const [globalConfig, setGlobalConfig] = useState(GlobalConfigDefault)
  const [lines, setLines] = useState([]);
  const inputRef = useRef(null);
  const [lastDirectory, setLastDirectory] = useState('');

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

  const addTabForFile = (file, parsedLines) => {
    const tab = {
      id: file.name,
      title: file.name,
      closable: true,
      content: (
        <LogViewerPage globalConfig={globalConfig} lines={parsedLines} />
      ),
      group: "default",
    }

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
        setLines(linesArray);
        console.log("GOT LINES", file.name)
        addTabForFile(file, linesArray);
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
        { label: <span>Show Line Numbers: {globalConfig.showLineNumber ? "1":"0"}</span>, action: () => { setConfigAttribute('showLineNumber', !globalConfig.showLineNumber); return true; } },
        { label: <span>Show Timestamp: {globalConfig.showTimestamp ? "1":"0"}</span>, action: () => { setConfigAttribute('showTimestamp', !globalConfig.showTimestamp); return true; } },
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
      <DockLayout ref={dockLayoutRef} defaultLayout={defaultLayout} groups={groups}/>
    </div>

    </>
  );
}

export default App;
