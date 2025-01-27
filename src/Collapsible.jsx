import React from "react";
import PropTypes from "prop-types";
import { RiCollapseVerticalLine, RiExpandVerticalLine } from "react-icons/ri";
import { FcCollapse, FcExpand } from "react-icons/fc";

const Collapsible = ({ title, children }) => {
  const [
    isExpanded,
    setIsExpanded
  ] = React.useState(true);

  const ref = React.useRef();

  const [height, setHeight] = React.useState();

  const handleToggle = e => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
    setHeight(ref.current.clientHeight);
  };

  const classes = `list-group-item ${
    isExpanded ? "is-expanded" : null
  }`;
  const currentHeight = isExpanded ? undefined : 0;
  return (
    <div
      className={classes}
    >
      <div className="card-title" onClick={handleToggle}>
        <span className="expandcollapse"> {isExpanded ? <FcCollapse/>:<FcExpand/>} </span>
        <h3>{title}</h3>
      </div>
      <div
        className={["card-collapse", isExpanded?'':'collapsed'].join(' ')}
      >
        <div className="card-body" ref={ref}>
          {children}
        </div>
      </div>
    </div>
  );
};

Collapsible.propTypes = {
  title: PropTypes.string
};

export default Collapsible;