import React, { useState, useEffect, useRef, useContext } from "react";

import { LogViewerLine } from "./LogViewerLine";
import { LogViewerHeader } from "./LogViewerHeader";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import "./LogViewer.scss";
import { AllFilesContext, GlobalConfigContext, DockLayoutContext } from "../GlobalContext";
import { LogViewerFiltersHeader, MatchesFilter } from "./LogViewerFiltersHeader";
import { GetNeighboringPanelsForTab, GetPanelForTab } from "./DockUtils";

let ConfigDefault = {
  debugLine: false,
}


export const LogViewerPage = ({ file, id, extraMenus=[] }) => {
  const [config, setConfig] = useState(ConfigDefault);
  const [showFilters, setShowFilters] = useState(false);
  const globalConfigContext = useContext(GlobalConfigContext);
  const allFilesContext = useContext(AllFilesContext);
  const dockLayoutContext = useContext(DockLayoutContext);
  const [ filters, setFilters ] = useState({ type: "root", children: [] });
  const listRef = useRef();

  
  const [ lines, setLines ] = useState( allFilesContext[file].lines );

  const setConfigAttribute = (attribute, value) => {
    setConfig(prevConfig => 
    {
      var out = {...prevConfig }
      out[attribute] = value;
      return out
    })
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const menuConfig = [
    ...extraMenus,
    {
      title: "Config",
      items: [
        { label: <span> {config.debugLine ? "☑":"☐"} Line Debug </span>, action: () => { setConfigAttribute('debugLine', !config.debugLine); return true; } },
      ],
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
  useEffect(() => {
    setLines(allFilesContext[file].lines.filter((line) => {
      return MatchesFilter(line, filters);
    }))
  }, [filters]);

  useEffect(() => {
    if (listRef && listRef.current) listRef.current.forceUpdate()
  }, [lines]); 

  const onScroll = (e) => {
    const neighbors = GetNeighboringPanelsForTab(dockLayoutContext.getLayout(), id);
    console.log("SCROLL", e.scrollOffset/15, neighbors)

    if (neighbors)
    for (var n of neighbors) {
      if (n)
      for (var t of n?.tabs) {
        //t?.content?.test(123)
        console.log("TAB", t.content)
      }
    }
  }

  /*this.prototype= {
    test: (val)=>{console.log("GOOOO", id, val)}
  }*/

  return (
    <>
      <LogViewerHeader menuConfig={menuConfig} />
      { showFilters && <LogViewerFiltersHeader conditionTree={filters} setConditionTree={UpdateFilters} /> }
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
    </div>
    </>
  );
};
