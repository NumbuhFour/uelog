import React, { useState, useEffect, useRef, useContext } from "react";

import { LogViewerLine } from "./LogViewerLine";
import { LogViewerHeader } from "./LogViewerHeader";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import "./LogViewer.scss";
import { AllFilesContext, GlobalConfigContext, DockLayoutContext, MyFilesContext } from "../GlobalContext";
import { LogViewerFiltersHeader, MatchesFilter } from "./LogViewerFiltersHeader";
import { GetNeighboringPanelsForTab, GetPanelForTab } from "./DockUtils";
import { Tooltip } from "react-tooltip";

let ConfigDefault = {
  debugLine: false,
  syncScroll: true,
}

const StatisticsTitles = {
  lines_total:"Total Lines",
  lines_match:"Matching Lines",
  errors_total:"Errors (total)",
  errors_match:"Errors (matching)",
  warnings_total:"Warnings (total)",
  warnings_match:"Warnings (matching)",
} 

const StatisticKeys_categories = [
  "lines",
  "errors",
  "warnings",
]

const StatisticsDefault = {
  lines_total: 0,
  lines_match: 0,
  errors_total: 0,
  errors_match: 0,
  warnings_total: 0,
  warnings_match: 0,
}


export const LogViewerPage = ({ file, id, extraMenus=[] }) => {
  const [config, setConfig] = useState(ConfigDefault);
  const [showFilters, setShowFilters] = useState(false);
  const globalConfigContext = useContext(GlobalConfigContext);
  const { allFiles, setAllFiles} = useContext(AllFilesContext);
  const dockLayoutContext = useContext(DockLayoutContext);
  const [ filters, setFilters ] = useState({ type: "root", children: [] });
  const listRef = useRef();

  const [ logCategories, setLogCategories ] = useState([]);
  const [ statistics, setStatistics ] = useState(StatisticsDefault);
  const [ logCategoryStats, setLogCategoryStats ] = useState({});

  let forceMove = false;

  
  const [ lines, setLines ] = useState( allFiles[file].lines );

  const setConfigAttribute = (attribute, value) => {
    setConfig(prevConfig => 
    {
      var out = {...prevConfig }
      out[attribute] = value;
      return out
    })
  }
  useEffect(() => {
    if (dockLayoutContext.getLayout()) {
      dockLayoutContext.find(id)['NeighborScroll'] = NeighborScroll;
      dockLayoutContext.find(id)['ForceUpdate'] = () => {
        listRef.current?.forceUpdate()
      };
    }
  }, [config])

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const menuConfig = [
    ...extraMenus,
    {
      title: "Config",
      items: [
        { label: <span> {config.syncScroll ? "☑":"☐"} Sync Scrolling with Neighbors </span>, action: () => { setConfigAttribute('syncScroll', !config.syncScroll); return true; } },
        { label: <span> {config.debugLine ? "☑":"☐"} Line Debug </span>, action: () => { setConfigAttribute('debugLine', !config.debugLine); return true; } },
      ],
    },
    {
      title: "Statistics",
      items:
      StatisticKeys_categories.map((stat) => 
              ({ label: (<span key={stat} className={['statistic', stat + "_total"].join(' ')}><label>{StatisticsTitles[stat + "_total"]}</label>: <span className="value">{statistics[stat + "_total"]}</span></span>), action: ()=>{} })
      ).concat(
      filters.children.length > 0 ? StatisticKeys_categories.map((stat) => 
        ({ label: (<span className={['statistic', stat + "_match"].join(' ')}><label>{StatisticsTitles[stat + "_match"]}</label>: <span className="value">{statistics[stat + "_match"]}</span></span>), action: ()=>{} })
      ):[]),
    },
    {
      title: "Filters",
      onClick: toggleFilters,
    }
  ];

  const Row = ({ index, key, style }) => (
    //<div key={key} style={style} > LINE {index} </div>
    <LogViewerLine style={style} config={{ ...globalConfigContext, ...config }} key={key} contentParts={lines[index]} />
  )

  /*const longestLine = lines.reduce((acc,iter) => {
    if (iter.message && iter.message.length > acc) acc = iter.message.length
    return acc;
  }, 0);
  console.log("Longest", longestLine)*/

  const UpdateFilters = (val) => {
    //console.log("EVALUATING FILTERS")
    setFilters(val);
    //console.log("EVALUATING FILTERS num ", lines.length, filters, lines)

  }

  const PopulateLogCategories = () => {
    let logCategoryCounts = {}

    allFiles[file].lines.forEach((line) => {
      if (line.category) {
        if (!(line.category in logCategoryCounts)) logCategoryCounts[line.category] = 0
        logCategoryCounts[line.category]++
      }
    });

    setLogCategoryStats(logCategoryCounts)
    setLogCategories([''].concat(Object.keys(logCategoryCounts).sort()))
  }

  useEffect(() => {

    let concatenationInd = 0;
    let statisticsCopy = JSON.parse(JSON.stringify(StatisticsDefault))
    setLines(allFiles[file].lines.reduce((acc, line, ind) => {

      const matches = MatchesFilter(line, filters);
        
      if (line.verbosity == "Warning") {
        statisticsCopy.warnings_total++;
        if (matches) statisticsCopy.warnings_match++;
      }
      if (line.verbosity == "Error" || line.verbosity == "Fatal") {
        statisticsCopy.errors_total++;
        if (matches) statisticsCopy.errors_match++;
      }

      if (matches) {
        

        const delta = ind - concatenationInd;
        if (delta > 1) {
          acc.push({
            type:"concat",
            numlines: delta
          })
        }
        acc.push(line)
        concatenationInd = line.linenumber
      }
      return acc;
    }, []))

    statisticsCopy.lines_total = allFiles[file].lines.length;
    statisticsCopy.lines_match = lines.length;
    setStatistics(statisticsCopy);

    PopulateLogCategories();

  }, [filters]);

  useEffect(() => {
    if (listRef && listRef.current) listRef.current.forceUpdate()

    PopulateLogCategories();
    console.log("Categories updated: ", logCategories)

  }, [lines]); 


  const onScroll = (e) => {
    if (e.scrollUpdateWasRequested) return;
    if (forceMove)  {
      return;
    }
    if (!config.syncScroll) return;

    const neighbors = GetNeighboringPanelsForTab(dockLayoutContext.getLayout(), id);
    const ind = Math.floor(e.scrollOffset/15) + 15
    const line = lines[ind]

    if (neighbors)
      for (var n of neighbors) {
        if (n)
        for (var t of n?.tabs) {
          //t?.content?.test(123)
          console.log(id, "Scroll detected", line.linenumber, e)
          if (t.file == file && t?.NeighborScroll)
          {
            t.NeighborScroll(line)
          }
        }
      }
  }

  /*this.prototype= {
    test: (val)=>{console.log("GOOOO", id, val)}
  }*/

  const updateFile = (filename, value) => {
    setAllFiles(old => {
      const newData = {...old}
      newData[filename] = value;
      old[filename] = value;
      return newData;
    })
  }

  const NeighborScroll = (targetLine) => {
    if (!config.syncScroll) return;

    forceMove = true;
    let scrollIndex  = 0;
    for (let i in lines) {
      const line = lines[i];
      if (line.linenumber < targetLine.linenumber) scrollIndex = i;
      else {
        if (line.linenumber == targetLine.linenumber) scrollIndex = i;
        else {
        }
        break;
      }
    }
    
    console.log("Scrolling FORCE", config, id,  targetLine.linenumber, scrollIndex - 15)
    listRef.current.scrollToItem(scrollIndex - 15, "start")
    forceMove = false;
    //listRef.current.forceUpdate();
  }
  useEffect(() => {
    if (dockLayoutContext.getLayout()) {
      dockLayoutContext.find(id)['NeighborScroll'] = NeighborScroll;
      dockLayoutContext.find(id)['forceUpdate'] = () => {
        listRef.current.forceUpdate()
      };
    }

  }, [])

  return (
    <>
    <MyFilesContext.Provider value={{myFile: allFiles[file], setMyFile: updateFile.bind(this, file)}}>
      <LogViewerHeader menuConfig={menuConfig} />
      { showFilters && <LogViewerFiltersHeader logCategories={logCategories} conditionTree={filters} setConditionTree={UpdateFilters} /> }
    <div className="LogViewer">
      <div className="content">
        <AutoSizer>
          {({ height, width }) => (
          <List ref={listRef}
            height={height}
            width={width}
            itemCount={lines.length}
            itemSize={15}
            onScroll={onScroll}
          >
            {Row}
          </List>
          )}
        </AutoSizer>
      </div>
      <Tooltip place="bottom-start" anchorSelect=".lineTooltip"/>
    </div>
    </MyFilesContext.Provider>
    </>
  );
};
