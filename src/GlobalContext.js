
import React, { useState, useEffect, useRef, useContext, createContext } from "react";

export const DockLayoutContext = createContext(null);

export const GlobalConfigContext = createContext(null);


export const AllFilesContext = createContext(null);
export const HighlightsContext = createContext([]);

export const MyFilesContext = createContext(null);


export const BookmarkFunctionsContext = createContext(null);

export const SavedFiltersContext = createContext(null);

export const SearchRateLimit = {handle:undefined};