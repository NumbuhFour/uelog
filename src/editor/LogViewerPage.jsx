import React, { useState, useEffect, useRef, useContext } from "react";

import { LogViewerLine } from "./LogViewerLine";
import { LogViewerHeader } from "./LogViewerHeader";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import "./LogViewer.scss";
import { AllFilesContext, GlobalConfigContext } from "../GlobalContext";
import { LogViewerFiltersHeader } from "./LogViewerFiltersHeader";

let ConfigDefault = {
  debugLine: false,
}


export const LogViewerPage = ({ file, id, extraMenus=[] }) => {
  const [config, setConfig] = useState(ConfigDefault);
  const [showFilters, setShowFilters] = useState(false);
  const globalConfigContext = useContext(GlobalConfigContext);
  const allFilesContext = useContext(AllFilesContext);

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
    <LogViewerLine style={style} config={{ ...globalConfigContext, ...config }} key={key} contentParts={allFilesContext[file].lines[index]} />
  )

  /*const longestLine = lines.reduce((acc,iter) => {
    if (iter.message && iter.message.length > acc) acc = iter.message.length
    return acc;
  }, 0);
  console.log("Longest", longestLine)*/

  return (
    <>
      <LogViewerHeader menuConfig={menuConfig} />
      { showFilters && <LogViewerFiltersHeader /> }
    <div className="LogViewer">
      <div className="content">
        <AutoSizer>
          {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={allFilesContext[file].lines.length}
            itemSize={15}
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
