import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import {DockLayout} from 'rc-dock';
import { LogViewerPage } from './editor/LogViewerPage';
import { parseLine } from "./editor/Parser";
import { LogViewerHeader } from "./editor/LogViewerHeader";
import "./App.scss";

import "./editor/LogViewer.scss";
import { AllFilesContext, BookmarkFunctionsContext, DockLayoutContext, GlobalConfigContext, MyFilesContext, SavedFiltersContext } from "./GlobalContext";
import { GetAllTabs, GetAllTabsForFile, GetAllTabsInGroup, GetPanelForTab } from "./editor/DockUtils";
import { BookmarksWindow } from "./editor/BookmarksWindow";

import { ToastContainer, toast } from 'react-toastify';
import { FiltersWindow } from "./editor/FiltersWindow";
import { AboutTab } from "./AboutTab";
import { IoMdClose } from "react-icons/io";
import { TbArrowsMaximize, TbWindowMaximize } from "react-icons/tb";
import { FaWindowMinimize } from "react-icons/fa";

const panelExtra = (panelData, context) => {

  let buttons = [];
  if (panelData.parent.mode !== 'window') {
    buttons.push(
      <span className='my-panel-extra-btn' key='maximize'
            title={panelData.parent.mode === 'maximize' ? 'Restore' : 'Maximize'}
            onClick={() => context.dockMove(panelData, null, 'maximize')}>
      {panelData.parent.mode === 'maximize' ? <FaWindowMinimize /> : <TbArrowsMaximize />}
      </span>
    )
    buttons.push(
      <span className='my-panel-extra-btn' key='new-window' title='Open in new window'
            onClick={() => context.dockMove(panelData, null, 'new-window')}>
      <TbWindowMaximize />
      </span>
    )
  }
  buttons.push(
    <span className='my-panel-extra-btn' key='close' title='Close'
          onClick={() => context.dockMove(panelData, null, 'remove')}>
      <IoMdClose />
    </span>
  )
  return <div>{buttons}</div>
}

let groups = {
  'logfile': {
    floatable: true,
    tabLocked: false,
    closable: true,
    newWindow: true,
    maximizable: true,
    panelExtra,
  },
  'windows': {
    floatable: true,
    tabLocked: false,
    closable: true,
    newWindow: true,
    maximizable: true,
    panelExtra,
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
  showOmissions: true,
}

const DefaultSavedFilters = [
  {"title":"Errors & Warnings","description":"Filter description","guid":"df802a28-f401-4d7a-86b0-f4a25730caef","type":"root","children":[{"type":"or","children":[{"type":"verbosity","children":[],"value":"fatal"},{"type":"verbosity","children":[],"value":"error"},{"type":"verbosity","children":[],"value":"warning"}],"value":""}]}
]


let SavingAnnotatedFile = false

function App() {
  const dockLayoutRef = useRef(null);
  const [ firstTab, setFirstTab ] = useState(true)
  let configDefault = GlobalConfigDefault
  const existingConfig = JSON.parse(localStorage.getItem('storedConfig'))
  if (existingConfig) configDefault = existingConfig;
  const [globalConfig, setGlobalConfig] = useState(configDefault)
  const [lastDirectory, setLastDirectory] = useState('');
  const [lastAnnotationDirectory, setLastAnnotationDirectory] = useState('');
  const [layoutState, setLayoutState] = useState()


  const [fileCollection, setFileCollection] = useState({})

  const [savedFilters, setSavedFilters] = useState(DefaultSavedFilters)


  const OnFirstTabOpened = () => {
    if (firstTab) {
      setFirstTab(false);
      if (dockLayoutRef.current.find('window_about')) {
        dockLayoutRef.current.dockMove(dockLayoutRef.current.find('window_about'), undefined, 'remove')
      }
    }
  }

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

  // Grab the directory used last time, saved to local storage
  useEffect(() => {
    const storedDirectory = localStorage.getItem('lastDirectory');
    if (storedDirectory) {
      console.log("Got last log directory from storage: ", storedDirectory)
      setLastDirectory(storedDirectory);
    }
    const storedAnnoDirectory = localStorage.getItem('lastAnnoDirectory');
    if (storedAnnoDirectory) {
      console.log("Got last anno directory from storage: ", storedAnnoDirectory)
      setLastAnnotationDirectory(storedAnnoDirectory);
    }
    
    const storedConfig = localStorage.getItem('storedConfig');
    if (storedConfig) {
      setGlobalConfig(JSON.parse(storedConfig));
    }

    
    const storedFilters = localStorage.getItem('storedFilters');
    console.log("Loading filters", )
    if (storedFilters) {
      setSavedFilters(JSON.parse(storedFilters));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('storedConfig', JSON.stringify(globalConfig));
    console.log("update conifg", localStorage.getItem('storedConfig'))
  }, [globalConfig]);
  useEffect(() => {
    if (savedFilters.length > 0) {
      localStorage.setItem('storedFilters', JSON.stringify(savedFilters));
      console.log("update filters", localStorage.getItem('storedFilters'))
    }
  }, [savedFilters]);

  const updateFile = (filename, value) => {
    setFileCollection(old => {
      const newData = {...old}
      newData[filename] = value;
      old[filename] = value;
      return newData;
    })
  }

  const makeLogTabContent = (tabData) => {
    return (
    <DockLayoutContext.Provider value={dockLayoutRef.current}>
        <LogViewerPage tabData={tabData} file={tabData.fileName} id={tabData.id} 
          extraMenus={
            [
              { 
                title: "Split",
                items: [
                  { label: 'Right', action: ()=> splitTab(tabData.fileName, tabData.id, 'right')}, 
                  { label: 'Left', action: ()=> splitTab(tabData.fileName, tabData.id, 'left')}, 
                  { label: 'Up', action: ()=> splitTab(tabData.fileName, tabData.id, 'up')}, 
                  { label: 'Down', action: ()=> splitTab(tabData.fileName, tabData.id, 'down')}, 
                  { label: 'After', action: ()=> splitTab(tabData.fileName, tabData.id, 'after-tab')}, 
                  { label: 'Before', action: ()=> splitTab(tabData.fileName, tabData.id, 'before-tab')}, 
                ]
              }
            ]
          }
        />
    </DockLayoutContext.Provider>)
  }

  const makeLogTab = (fileName, tabData=undefined) => {
    const file = fileCollection[fileName];
    console.log("MAKING TAB FOR FILE", file)
    
    const id = file.name + "||" + Math.random() + "||" + file.nextId;
    const tab = {
      id: id,
      title: file.name,
      fileName: file.name,
      closable: true,
      cached: true,
      filters: tabData?.filters,
      scroll: tabData?.scroll || 0,
      config: tabData?.config,
      content: makeLogTabContent,
      group: "logfile",
    }

    setFileCollection(old => {
      const newData = {...old}
      newData[fileName].nextId++
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
    OnFirstTabOpened();
    dockLayoutRef.current.dockMove(tab, dockLayoutRef.current.getLayout().dockbox, "middle")
  }

  
  const handleAnnotationFileOpen = (event) => {
    const file = event.target.files[0];
    if (file) {

      // Update last-used directory
      if (file.webkitRelativePath) {
        const directory = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
        setLastAnnotationDirectory(directory);
        localStorage.setItem('lastAnnoDirectory', directory);
      }

      // Open file
      const reader = new FileReader();
      reader.onload = (e) => {
        let text = e.target.result;
        
        const sep = text.indexOf('---\n')
        if (sep == -1) {
          toast.error("Error parsing annotation file")
          return
        }

        text = text.substring(sep+4)

        const fileData = JSON.parse(text);
        const layoutData = fileData.layout;
        const files = fileData.fileCollection
        if (!layoutData) {
          toast.error("Error parsing annotation file: Layout not found")
          return
        }
        if (!files) {
          toast.error("Error parsing annotation file: File data not found")
          return
        }
        let success = true;
        Object.keys(files).forEach(key => {
          const file = files[key]
          const lines = file.lines.join('\n')
          if (!file.lines) success = false;
          const lineData = parseLines(lines)
          files[key].lines = lineData 
        })

        if (success) {

          //const tabs = GetAllTabsInGroup(dockLayoutRef.current.getLayout(), "logfile");
          //console.log("Existing tabs", tabs);
          setLayoutState(undefined)
          //tabs.forEach(tab => dockLayoutRef.current.dockMove(tab, undefined, "remove"))

          setTimeout(() =>  {
            setFileCollection(files)
            setTimeout(() => {
              dockLayoutRef.current.loadLayout(layoutData)
              toast("Loaded!")
            } , 100)
          }
          , 100)


        }
      };
      reader.readAsText(file);
    }
  }

  const parseLines = (text) => {
    let earliestTime = undefined
    let anyParseErrors = false;
    const rtn = text.split("\n").map((line, ind) => {
      const out = parseLine(line, ind, earliestTime)
      if (out.datetime && !earliestTime) {
        earliestTime = out.datetime
      }
      anyParseErrors |= !out.parseSuccess
      return out
    });
    if (anyParseErrors) {
      toast.error('Errors found during file parsing')
    }
    return rtn;
  }

  const handleLogFileOpen = (event) => {
    const file = event.target.files[0];
    if (file) {

      // Update last-used directory
      if (file.webkitRelativePath) {
        const directory = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
        setLastDirectory(directory);
        console.log("Updating log directory", directory)
        localStorage.setItem('lastDirectory', directory);
      }
      
      // Open file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const linesArray = parseLines(text)
        
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

  const OpenWindowTab = (newtab) => {
    const tabs = ['window_filter', 'window_bookmark', 'window_about']
    
    OnFirstTabOpened();

    if (!tabs.some(id => {
      if (dockLayoutRef.current.find(id)) {
        dockLayoutRef.current.dockMove(newtab, id, 'after-tab')
        return true;
      }
    }))
      dockLayoutRef.current.dockMove(newtab, dockLayoutRef.current.getLayout().dockbox, 'right')
      
  }

  const MakeBookmarkTab = () => ({
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
  })
  const OpenBookmarkTab = (keepClosed=false) => {
    const existing = dockLayoutRef.current.find('window_bookmark');
    const newtab = MakeBookmarkTab();
    if (existing) {
      //dockLayoutRef.current.updateTab('window_bookmark', newtab)
    }
    else if (!keepClosed){
      OpenWindowTab(newtab)
    }
  }

  const OpenAddBookmark = (filename, line) => {
    SetBookmark(filename, line, {
      message: "Bookmark"
    })
    OpenBookmarkTab();
  }

  const OpenBookmark = (filename, line) => {
    OpenBookmarkTab();
  }

  const OpenFiltersTab = () => {
    const existing = dockLayoutRef.current.find('window_filter');
    const newtab = {
      id: 'window_filter',
      title: "Filters",
      closable: true,
      content: (
        <AllFilesContext.Consumer>
          {({allFiles, setAllFiles}) => (
            <FiltersWindow allFiles={allFiles} GetDockLayout={()=>dockLayoutRef.current}/>
          )}
        </AllFilesContext.Consumer>
      ),
      group: "windows",
    }
    if (existing) {
      //dockLayoutRef.current.updateTab('window_bookmark', newtab)
    }
    else {
      OpenWindowTab(newtab)
    }
  }

  const MakeAboutTab = () => ({
      id: 'window_about',
      title: "About",
      closable: true,
      content: (
        <AboutTab />
      ),
      group: "windows",
    })
  const OpenAboutTab = () => {
    const existing = dockLayoutRef.current.find('window_about');
    const newtab = MakeAboutTab()
    if (existing) {
      //dockLayoutRef.current.updateTab('window_bookmark', newtab)
    }
    else {
      OpenWindowTab(newtab)
    }
  }


  // Drop-down menu config
  const menuConfig = [
    {
      title: "File",
      items: [
        { label: "Open...", action: () => {
          const fileInput = document.querySelector('#logFileInput');
          console.log("Last log dir: ", lastDirectory)
          if (lastDirectory) {
            fileInput.setAttribute("webkitDirectory", lastDirectory)
          }
          fileInput.click() 
        },
      },
        { label: "Save Annotated Files", action: () => {
          SavingAnnotatedFile = true;
          const layoutData = dockLayoutRef.current.saveLayout()
          SavingAnnotatedFile = false;

          const collection = {}
          // simplify the files by un-parsing the lines
          Object.keys(fileCollection).forEach(key => {
            const file = fileCollection[key];
            const out = {bookmarks: file.bookmarks, name: file.name}
            out.lines = file.lines.map(line=>line.fulltext)
            collection[key] = out;
          })
          
          const data = {
            layout: layoutData,
            fileCollection: collection,
          }
          
          let savedfile = JSON.stringify(data, null, 4)
          savedfile = 
`# README

This is an annotated Unreal Engine log file.
It is best loaded and viewed at ${document.location}

---
${savedfile}
`
          const blob = new Blob([savedfile], {type: "text/plain" })
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          let firstFileName = "UnrealEngine";
          if (Object.keys(fileCollection).length > 0) {
            firstFileName = fileCollection[Object.keys(fileCollection)[0]].name
            firstFileName = firstFileName.replace('.log','')
          }
          link.download = firstFileName + '.annotated.log'
          link.href = url;
          link.click();
        }},
        { label: "Load Annotated File", action: () => {
          if (firstTab || window.confirm("Loading a layout will lose your current state. Continue?")) {
            const fileInput = document.querySelector('#annotationFileInput');
            console.log("Last anno dir: ", lastAnnotationDirectory)
            if (lastAnnotationDirectory) {
              fileInput.setAttribute("webkitDirectory", lastAnnotationDirectory)
            }
            fileInput.click() 
          }
          else {
            toast('Cancelled Load')
          }
        }},
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
        { label: <span>{globalConfig.showOmissions ? "☑":"☐"} Show Omissions </span>, action: () => { setConfigAttribute('showOmissions', !globalConfig.showOmissions); return true; } },
        { label: <span>{globalConfig.colorCategories ? "☑":"☐"} Color Categories </span>, action: () => { setConfigAttribute('colorCategories', !globalConfig.colorCategories); return true; } },
        { label: <span>{globalConfig.contrastMessage ? "☑":"☐"} Contrast Message</span>, action: () => { setConfigAttribute('contrastMessage', !globalConfig.contrastMessage); return true; } },
      ],
    },
    {
      title: "Windows",
      items: [
        { label: <span> Bookmarks </span>, action: () => { OpenBookmarkTab(); } },
        { label: <span> Filters </span>, action: () => { OpenFiltersTab(); } },
        { label: <span> About </span>, action: () => { OpenAboutTab(); } },
      ],
    },
  ];

  const defaultLayout = {
    dockbox: {
      mode: 'horizontal',
      id: "default_panel",
      children: [
        
        {
          mode: 'horizontal',
          size: 200,
          children: [
            {
              tabs: [
                {
                  id: 'window_about',
                  title: "About",
                  closable: true,
                  content: (
                    <AboutTab />
                  ),
                  group: "windows",
                }

              ],
            },
          ]
        },
        
        
        ]
    }
  };

  const saveTab = (tabData) => {
    console.log('SAVE TAB', SavingAnnotatedFile, tabData)
    if (!SavingAnnotatedFile) return tabData;

    let {id, fileName, group, title, filters, scroll, config} = tabData;
    
    if (group == 'windows') return { group: 'remove' };

    return {id, fileName, group, title, filters, scroll, fromload:true , config};
  }

  const loadTab = (savedTab) => {
    console.log("LOAD TAB", savedTab)
    if (savedTab.group == 'remove') {
      console.log("load - Removing")
      return undefined;
    }

    if (savedTab.group == "logfile" && savedTab.fromload) {
      console.log('load - Making tab - ')
      return makeLogTab(savedTab.fileName, savedTab)
    }

    if (savedTab.fileName && !(savedTab.fileName in fileCollection)) {
      console.log("load - File not in collection, removing")
      return undefined;
    }

    return savedTab;
  }

  const onLayoutChange = (newLayout, currentTabId, direction)=> {
    if (direction == 'remove') {
      const fileName = dockLayoutRef.current.find(currentTabId)?.fileName
      if (fileName) {
        const tabs = GetAllTabsForFile(newLayout, fileName);
        if (tabs.length == 0) {
          setLayoutState(newLayout)
          setTimeout(() => {
            setFileCollection(old => {
              const update = {...old}
              delete update[fileName]
              return update;
            })
            console.log("Updating file collection, no longer using", fileName)
          }, 100) // need to wait until layout updates so that changing the collection doesn't break tabs...
          return;
        }
      }
    }
    setLayoutState(newLayout)
  }

  return (
    <>
    <input webkitdirectory id="logFileInput" type="file" accept="text/*" style={{ display: 'none' }} onChange={handleLogFileOpen} />
    <input webkitdirectory id="annotationFileInput" type="file" accept="text/*" style={{ display: 'none' }} onChange={handleAnnotationFileOpen} />
    <LogViewerHeader menuConfig={menuConfig} />

    <div className="tabContainer">
        <GlobalConfigContext.Provider value={globalConfig}>
          <BookmarkFunctionsContext.Provider value={{OpenAddBookmark, OpenBookmark}}>
            <SavedFiltersContext.Provider value={[savedFilters, setSavedFilters, OpenFiltersTab]}>
              <AllFilesContext.Provider value={{allFiles:fileCollection, setAllFiles:setFileCollection}}>
                <DockLayout layout={layoutState} onLayoutChange={onLayoutChange} loadTab={loadTab} saveTab={saveTab} ref={dockLayoutRef} dropMode={globalConfig.dragEdges ? 'edge':''} defaultLayout={defaultLayout} groups={groups}/>
              </AllFilesContext.Provider>
            </SavedFiltersContext.Provider>
          </BookmarkFunctionsContext.Provider>
      </GlobalConfigContext.Provider>
    </div>
    <ToastContainer position="bottom-right" draggable theme="dark"/>
    </>
  );
}

export default App;
