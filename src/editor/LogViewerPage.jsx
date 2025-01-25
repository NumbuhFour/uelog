import React, { useState, useEffect, useRef } from "react";

import { LogViewerLine } from "./LogViewerLine";
import { LogViewerHeader } from "./LogViewerHeader";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import "./LogViewer.scss";

let ConfigDefault = {
  debugLine: false,
}


export const LogViewerPage = ({ globalConfig, lines, extraMenus=[] }) => {
  const [config, setConfig] = useState(ConfigDefault);

  const setConfigAttribute = (attribute, value) => {
    setConfig(prevConfig => 
    {
      var out = {...prevConfig }
      out[attribute] = value;
      return out
    })
  }

  const menuConfig = [
    ...extraMenus,
    {
      title: "Config",
      items: [
        { label: <span>Line Debug: {config.debugLine ? "1":"0"}</span>, action: () => { setConfigAttribute('debugLine', !config.debugLine); return true; } },
      ],
    },
  ];

  
  const Row = ({ index, key, style }) => (
    //<div key={key} style={style} > LINE {index} </div>
    <LogViewerLine style={style} config={{ ...globalConfig, ...config }} key={key} contentParts={lines[index]} />
  )

  return (
    <div className="LogViewer">
      <LogViewerHeader menuConfig={menuConfig} />
      <div className="content">
        <AutoSizer>
          {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={lines.length}
            itemSize={15}
          >
            {Row}
          </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
