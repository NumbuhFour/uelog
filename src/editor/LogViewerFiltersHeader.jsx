import React, { useEffect, useRef, useState } from "react";

export const LogViewerFiltersHeader = ({ filters, setFilters }) => {
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const menuRef = useRef(null);

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

    return (
        <div ref={menuRef} className="FileMenu">
            {menuConfig.map((menu, index) => (
                <div key={index} style={{ position: "relative" }}>
                    <span
                        className="title"
                        onClick={() => {
                            if (menu.onClick) menu.onClick(index)
                            else toggleMenu(index)}
                        }
                    >
                        {menu.title}
                    </span>
                    {openMenuIndex === index && menu.items && (
                        <div className="menu">
                            {menu.items.map((item, idx) => (
                                <div className="option"
                                    key={idx}
                                    style={{
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                    }}
                                    onClick={(e)=>{if (!item.action(e)) setOpenMenuIndex(null)}}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
