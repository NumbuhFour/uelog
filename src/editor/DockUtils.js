import DockLayout from "rc-dock";

function HasTab(ParentData, tabId) {
    if (ParentData.tabs) {
        return ParentData.tabs.some(tab => tab.id == tabId)
    }
    else if (ParentData.children) {
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
        for (let child of ParentData.children) {
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