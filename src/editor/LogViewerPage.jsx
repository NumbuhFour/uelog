import React, { useState, useEffect, useRef } from "react";

import { LogViewerLine } from "./LogViewerLine";
import { LogViewerHeader } from "./LogViewerHeader";

import "./LogViewer.scss";

let ConfigDefault = {
  debugLine: false,
}


export const LogViewerPage = React.memo(({ globalConfig, lines }) => {
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
    {
      title: "Config",
      items: [
        { label: <span>Line Debug: {config.debugLine ? "1":"0"}</span>, action: () => { setConfigAttribute('debugLine', !config.debugLine); return true; } },
      ],
    },
  ];

  return (
    <div className="LogViewer">
      <LogViewerHeader menuConfig={menuConfig} />
      <div className="content">
        {lines.map((line, index) => (
          <LogViewerLine config={{ ...globalConfig, ...config }} key={index} contentParts={line} />
        ))}
      </div>
    </div>
  );
});
