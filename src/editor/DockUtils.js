import DockLayout from "rc-dock";

function HasTab(ParentData, tabId) {
    if (ParentData?.tabs) {
        return ParentData.tabs.some(tab => tab.id == tabId)
    }
    else if (ParentData?.children) {
        return ParentData.some(child => HasTab(child, tabId))
    }
    return false;
}

// Looks for a panel that contains the tab, given a panel or box
function GetPanelForTab_FromPanelBox(data, tabId) {
    if (!data) return undefined;

    // We're a panel and we have this tab, return us
    if (data.tabs && HasTab(data, tabId)) return data;
    // We're a box and we have panels and boxes. Look through them recursively
    else if (data.children) {
        for (let child of data.children) {
            const found = GetPanelForTab_FromPanelBox(child, tabId)
            if (found != undefined) return found;
        }
    }
    return undefined;
}

export function GetPanelForTab(layoutData, tabId) {
    let found;

    found = GetPanelForTab_FromPanelBox(layoutData.dockbox, tabId);
    if (found) return found;
    found = GetPanelForTab_FromPanelBox(layoutData.floatbox, tabId);
    if (found) return found;
    found = GetPanelForTab_FromPanelBox(layoutData.maxbox, tabId);
    if (found) return found;
    found = GetPanelForTab_FromPanelBox(layoutData.windowbox, tabId);
    if (found) return found;

    return undefined;
}

// Return the panels that are neighbors of this panel
// Does not include subboxes
export function GetNeighboringPanels(panelData, mode="horizontal") {
    const parent  = panelData.parent;
    if (parent?.mode == mode) {
        let panels = parent.children.filter(child =>
            // Exclude ourself
            child != panelData && 
            // Exclude boxes
            child.tabs != undefined);
        
        const singleBoxes = parent.children.filter(child => 
            // let there be boxes with only one child
            child.children?.length == 1)
            .reduce((acc, iter)=>{
                // there should be only one child
                const child = iter.children[0]
                // the child needs to be a panel
                if (child && child.tabs)
                    acc.push(child)
            }, []);
        
        return panels.concat(singleBoxes)
    }
    return [];
}

export function GetNeighboringPanelsForTab(layoutData, tabId, mode="horizontal") {
    const panel = GetPanelForTab(layoutData, tabId)
    if (panel)
        return GetNeighboringPanels(panel, mode)
    return [];
}

function GetAllTabsForFile_Internal(ParentData, filename) {
    if (ParentData?.tabs) {
        return ParentData.tabs.filter(tab => tab['fileName'] == filename)
    }
    else if (ParentData?.children) {
        return ParentData.children.reduce((acc, iter) => {
            acc = acc.concat(GetAllTabsForFile_Internal(iter, filename))
            return acc;
        }, [])
    }
    else if (ParentData && ParentData['fileName'] == filename) {
        return [ParentData];
    }
    return [];
}
export function GetAllTabsForFile(layoutData, filename) {
    let out = []
    out = out.concat(GetAllTabsForFile_Internal(layoutData.dockbox, filename))
    out = out.concat(GetAllTabsForFile_Internal(layoutData.floatbox, filename))
    out = out.concat(GetAllTabsForFile_Internal(layoutData.maxbox, filename))
    out = out.concat(GetAllTabsForFile_Internal(layoutData.windowbox, filename))

    return out;
}

function GetAllTabsInGroup_Internal(ParentData, group) {
    if (ParentData?.tabs) {
        return ParentData.tabs.filter(tab => tab.group == group)
    }
    else if (ParentData?.children) {
        return ParentData.children.reduce((acc, iter) => {
            acc = acc.concat(GetAllTabsInGroup_Internal(iter, group))
            return acc;
        }, [])
    }
    else if (ParentData && ParentData.group == group) {
        return [ParentData];
    }
    return [];
}
export function GetAllTabsInGroup(layoutData, group) {
    let out = []
    out = out.concat(GetAllTabsInGroup_Internal(layoutData.dockbox, group))
    out = out.concat(GetAllTabsInGroup_Internal(layoutData.floatbox, group))
    out = out.concat(GetAllTabsInGroup_Internal(layoutData.maxbox, group))
    out = out.concat(GetAllTabsInGroup_Internal(layoutData.windowbox, group))

    return out;
}



function GetAllTabs_Internal(ParentData) {
    if (ParentData?.tabs) {
        return ParentData.tabs
    }
    else if (ParentData?.children) {
        return ParentData.children.reduce((acc, iter) => {
            acc = acc.concat(GetAllTabs_Internal(iter))
            return acc;
        }, [])
    }
    else if (ParentData) {
        return [ParentData];
    }
    return [];
}
export function GetAllTabs(layoutData) {
    let out = []
    out = out.concat(GetAllTabs_Internal(layoutData.dockbox))
    out = out.concat(GetAllTabs_Internal(layoutData.floatbox))
    out = out.concat(GetAllTabs_Internal(layoutData.maxbox))
    out = out.concat(GetAllTabs_Internal(layoutData.windowbox))

    return out;
}