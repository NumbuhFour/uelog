import { useEffect, useImperativeHandle, useContext, useRef, useState } from "react";
import { AddHighlight, EHighlightModes } from "./HighlightUtils";
import { MyFilesContext, HighlightsContext } from "../GlobalContext";
import { FaArrowDown, FaArrowRight, FaArrowUp } from "react-icons/fa";


export const SearchBox = ({ inref, onNext, index, total }) => {
    const [ visible, setVisible ] = useState(false);
    const [ text, setText ] = useState("");
    const {myFile, setMyFile} = useContext(MyFilesContext)
    const [highlights, setHighlights] = useContext(HighlightsContext);


    const inputRef = useRef(null);

    useImperativeHandle(inref, () => ({
        focus: () => {
            setVisible(true);
            if (inputRef.current) inputRef.current.focus();
        }
    }))

    useEffect(() => {
        if (visible) {
            inputRef.current.focus();
        }
    }, [visible] )


    const onKeyUp = (e) => {
        if (e.key === "Enter") {
            console.log("ENTER ", e)
            onNext(e.shiftKey ? -1:1)
        }

        if (e.key === "Escape") {
            setVisible(false)
        }

    }

    const onChangeInternal = (e) => {
        setText(e.target.value);
        AddHighlight(highlights, setHighlights, e.target.value, myFile, EHighlightModes.SEARCH_NONFOCUS)
    }

    if (!visible) return <div ref={inref}></div>

    return (<>
        <div ref={inref} className="searchbox">
            <input value={text} onKeyUp={onKeyUp} ref={inputRef} type="text" placeholder="Search" onChange={onChangeInternal}></input>
            <span className="buttons">
                <a className="smbtn prev" onClick={() => onNext(-1) }> <FaArrowUp/> </a>
                <a className="smbtn prev" onClick={() => onNext(1) }> <FaArrowDown/> </a>
            </span>
            <span className="counts">{Math.min(index+1,total)} of {total} </span>
        </div>
    </>);
}