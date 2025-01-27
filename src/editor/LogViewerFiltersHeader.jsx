import React, { useContext, useEffect, useRef, useState } from "react";
import { BiSave } from "react-icons/bi";
import { FaCopy, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { LuClipboardPaste } from "react-icons/lu";
import { toast } from 'react-toastify';
import { SavedFiltersContext } from "../GlobalContext";

const CompositeTypes = [
    'and',
    'or',
    'root',
    'not',
]

const IsTypeComposite = (type) => CompositeTypes.includes(type)

const ConditionNames = {
    'root': '',
    'empty': '',
    'and': 'AND',
    'or': 'OR',
    'not': 'NOT',
    'category': 'Category',
    'categoryIncludes': 'Category Includes',
    'textIncludes': 'Text Includes',
    'messageIncludes': 'Message Includes',
    'textMatch': 'Text Matches Regex',
    'bookmarked': 'Is Bookmarked',
}
const ConditionOptions = [
    'and',
    'or',
    'not',
    'category',
    'categoryIncludes',
    'textIncludes',
    'messageIncludes',
    'textMatch',
    'bookmarked',
]

export function MatchesFilter(contentParts, filter, isBookmarked) {
    //console.log("MATCH CHECK ", contentParts, filter)
    if (filter == undefined) {
        //console.log("NO FILTER")
        return true;
    }
    switch(filter.type) {
        case 'root':
            //console.log("ROOT")
        case 'and':
            //console.log('MATCH and')
            return filter.children.length == 0 || filter.children.every(i => MatchesFilter(contentParts, i, isBookmarked))
        case 'or':
            //console.log('MATCH or')
            return filter.children.length == 0 || filter.children.some(i => MatchesFilter(contentParts, i, isBookmarked))
        case 'not':
            //console.log('MATCH not')
            return filter.children.length == 0 || !filter.children.every(i => MatchesFilter(contentParts, i, isBookmarked))
        case 'category':
            //console.log("Include check: ", filter.value, contentParts.category, contentParts.category?.toLowerCase().includes(filter.value.toLowerCase()))
            return filter.value == '' || contentParts.category?.toLowerCase() == filter.value.toLowerCase()
        case 'categoryIncludes':
            //console.log("Include check: ", filter.value, contentParts.category, contentParts.category?.toLowerCase().includes(filter.value.toLowerCase()))
            return filter.value == '' || contentParts.category?.toLowerCase().includes(filter.value.toLowerCase())
        case 'textIncludes':
            //console.log('MATCH textIncludes')
            return filter.value == '' || contentParts.fulltext?.toLowerCase().includes(filter.value.toLowerCase())
        case 'textMatch': // Regex match full text
        //console.log('MATCH textMatch')
            return filter.value == '' || contentParts.fulltext.match(new RegExp(filter.value)) != null
        case 'messageIncludes':
            //console.log('MATCH messageIncludes')
            return filter.value == '' || contentParts.message?.toLowerCase().includes(filter.value.toLowerCase())
        case 'bookmarked':
            //console.log('MATCH messageIncludes')
            return isBookmarked;
        default:
            //console.log("NO FILTER??", filter.type)
            return true;
    }
}

const ConditionNode = ({ node, updateNode, removeNode, logCategories }) => {
    const [ showDropdown, setShowDropdown ] = useState(true)
    const dropdownRef = useRef();
    const addRef = useRef();

    const addCondition = (type) => {
        const newCondition = { type, children:[], value: ''};
        updateNode((prev) => ({
            ...prev,
            children: [...(prev.children || []), newCondition],
        }))
        setShowDropdown(false);

    }

    const updateValue = (value) => {
        updateNode((prev) => ({
            ...prev,
            value,
        }))
    }

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) && event.target != addRef.current) {
          setShowDropdown(false);
          console.log('undo')
        }
      };
    React.useEffect(() => {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, []);


    let NodeInput;
    if (node.type == "category") {
        NodeInput = <select name="verbosity" value={node.value} onChange={(e) => updateValue(e.target.value)}>
                        { logCategories.map(cat => (
                            <option value={cat}> {cat} </option>
                        )) }
                    </select>
    }
    else if (node.type == "verbosity") {
        NodeInput = <select name="verbosity" value={node.value} onChange={(e) => updateValue(e.target.value)}>
                        <option value="fatal"> Fatal </option>
                        <option value="error"> Error </option>
                        <option value="warning"> Warning </option>
                        <option value="display"> Display </option>
                        <option value="log"> Log </option>
                        <option value="verbose"> Verbose </option>
                        <option value="veryverbose"> Very Verbose </option>
                    </select>
    }
    else if (node.type == "bookmarked") {
        NodeInput = <span></span>
    }
    else if (!IsTypeComposite(node.type)) {
        NodeInput = <input
                        type="text"
                        placeholder="Enter text"
                        value={node.value || ""}
                        onChange={(e) => updateValue(e.target.value)}
                    />
    }


    return (
        <div className="node">
            <span className="info">
                <span className="title"> {ConditionNames[node.type]} </span>
                {!IsTypeComposite(node.type) && (
                    <span>
                        {NodeInput}
                    </span>
                )}
                {node.type !== 'root' && (
                    <>
                        <a className="smbtn remove" onClick={removeNode}><FaTrash/></a>
                    </>
                )}
            </span>

            {IsTypeComposite(node.type) && (
                <>
                    <div style={{marginLeft:"10px"}} >
                    
                    {node.children &&
                    node.children.map((child, index) => (
                        <div className="child">
                        <ConditionNode
                        logCategories={logCategories}
                        key={index}
                        node={child}
                        removeNode={() => {
                            updateNode((prev) => ({
                                ...prev,
                                children: prev.children.filter((_, i) => i !== index)
                            }))
                        }}
                        updateNode={(updater) =>
                            updateNode((prev) => {
                            const newChildren = [...prev.children];
                            newChildren[index] = updater(newChildren[index]);
                            return { ...prev, children: newChildren };
                            })
                        }
                        />
                        </div>
                    ))}

                    {
                        (node.type != 'not' || node.children.length == 0) &&
                        (<>
                            <a className="smbtn add" ref={addRef} onClick={() => setShowDropdown(!showDropdown) }> <FaPlus/> </a>
                        </>)
                    }

                    {showDropdown && (
                        <span
                            ref={dropdownRef}
                            className="addcondition"
                        >
                            {ConditionOptions.map(opt => (
                                <>
                                    <button onClick={() => addCondition(opt)}>{ConditionNames[opt]}</button>
                                </>
                            ))}
                        </span>
                    )}
                    </div>
                </>
            )}
        </div>
    )
}

function generateGUID() {
    let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return guid;
}

export const LogViewerFiltersHeader = ({ logCategories, conditionTree, setConditionTree }) => {
  
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const menuRef = useRef(null);

    const [ savedFilters, setSavedFilters, OpenFiltersTab ] = useContext(SavedFiltersContext);

    const [ pasteValue, setPasteValue ] = useState("")

    const toggleMenu = (index) => {
        setOpenMenuIndex(openMenuIndex === index ? null : index);
    };

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            console.log("Clicked outside")
            setOpenMenuIndex(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const menuConfig = [
        {
            title: "Filters",
            children: [],
        }
    ]


    const OnCopy = () => {
        console.log("Copy click!", JSON.stringify(conditionTree))
        navigator.clipboard.writeText(JSON.stringify(conditionTree))
        toast("Copied!")
    }

    const OnSave = () => {
        setSavedFilters(old => {
            const newData = [...old]
            newData.push({
                title: "Filter Title",
                description: "Filter description",
                guid: generateGUID(),
                ...conditionTree
            })
            return newData;
        })
        OpenFiltersTab()
        toast("Filter saved!")
    }

    const OnPasteChange = (e) => {
        setPasteValue(e.target.value)
    }


    const ValidateNode = (node) => {
        if (typeof node != 'object') {
            console.error("Node is not object", node)
            return false;
        }
        if (Array.isArray(node)){
            console.error("Node is an array", node)
            return false;
        }

        if (!(node.type in ConditionNames)) {
            console.error("Node type is not in valid", node)
            return false;
        }
        if (IsTypeComposite(node.type)) {
            if (node.children == null) {
                console.error("Composite node does not have children list")
                return false;
            }
            if (!Array.isArray(node.children)) {
                console.error("Composite node's children is not an array")
                return false;
            }
            return node.children.every(c => ValidateNode(c))
        }
        else {
            if (typeof node.value != 'string') {
                console.error("Singular node's value is not string")
                return false;
            }
            if (node.value == undefined) {
                console.error("Singular node's value is undefined")
                return false;
            }
            return true;
        }
    }
    const ValidateTree = (treeString) => {
        try {
            const tree = JSON.parse(treeString)
            if (tree?.type != "root") return false;
            return ValidateNode(tree)
        }
        catch(e) {
            console.error("Error during parse", treeString, e)
            return false;
        }
    }

    const OnPasteSubmit = () => {
        if (pasteValue.trim() == '') {
            toast.error("You must paste into the text box first")
            return;
        }

        if (ValidateTree(pasteValue)) {
            console.log("Pasting!", JSON.parse(pasteValue))
            toast("Loaded filter!")
            setConditionTree(JSON.parse(pasteValue))
            setPasteValue("")
        }
        else {
            toast.error("Unable to parse filter.")
            console.error("Bad condition tree", pasteValue)
        }
    }

    const OnPasteKey = (e) => {
        if (e.key == "Enter" && !e.shiftKey) {
            OnPasteSubmit()
        }
    }

    return (
        <div ref={menuRef} className="Filters">
            <ConditionNode
                logCategories={logCategories}
                node={conditionTree}
                updateNode={(updater) => {
                    setConditionTree(updater(conditionTree))
                }}
            />
            <div className="loadbtns">
                <a onClick={OnSave} className="savebtn borderbtn"><FaSave/></a>
                <a onClick={OnCopy} className="copybtn borderbtn"><FaCopy/></a>
                <input onKeyDown={OnPasteKey} onChange={OnPasteChange} value={pasteValue} type="text" placeholder="Paste here"></input>
                <a onClick={OnPasteSubmit} className="loadbtn borderbtn"><LuClipboardPaste/></a>
            </div>
        </div>
    );
};
