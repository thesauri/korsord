import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import { EditMode } from "./Crossword";

interface SidebarProps {
  mode: EditMode;
  setMode: (arg: EditMode) => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const [hide, setHide] = useState(false);
  if (hide) {
    return (
      <div className="collapsed-sidebar">
        <div className="sidebar-section" style={{ marginTop: "10px" }}>
          <div className="section-list tools">
            <p
              className={props.mode === EditMode.DRAW ? "active" : ""}
              onClick={() => props.setMode(EditMode.DRAW)}
            >
              <i className="fa fa-pencil"></i>
            </p>
            <p
              className={props.mode === EditMode.ERASE ? "active" : ""}
              onClick={() => props.setMode(EditMode.ERASE)}
            >
              <i className="fa fa-eraser" id="erase"></i>
            </p>
            <p
              className={props.mode === EditMode.WRITE ? "active" : ""}
              onClick={() => props.setMode(EditMode.WRITE)}
            >
              <i className="fa fa-font" id="write"></i>
            </p>
          </div>
        </div>
        <p
          className="clickable"
          onClick={() => setHide(!hide)}
          style={{ textAlign: "left", paddingLeft: "16px" }}
        >
          <i className="fa fa-angle-double-right" />
        </p>
      </div>
    );
  } else {
    return (
      <div className="sidebar">
        <Link to={""} style={{ textDecoration: "none" }}>
          <div className="sidebar-header sidebar-section">
            <h3 className="sidebar-header-text">Fredagskorsord</h3>
          </div>
        </Link>
        <div className="sidebar-section">
          <h3>Verktyg</h3>
          <div className="section-list tools">
            <p
              className={props.mode === EditMode.DRAW ? "active" : ""}
              onClick={() => props.setMode(EditMode.DRAW)}
            >
              <i className="fa fa-pencil"></i>
              Penna (B)
            </p>
            <p
              className={props.mode === EditMode.ERASE ? "active" : ""}
              onClick={() => props.setMode(EditMode.ERASE)}
            >
              <i className="fa fa-eraser" id="erase"></i>
              Suddgummi (E)
            </p>
            <p
              className={props.mode === EditMode.WRITE ? "active" : ""}
              onClick={() => props.setMode(EditMode.WRITE)}
            >
              <i className="fa fa-font" id="write"></i>
              Text {props.mode === EditMode.WRITE ? "(ESC to exit)" : "(Enter)"}
            </p>
          </div>
        </div>
        <div className="sidebar-section">
          <p
            className="clickable"
            onClick={() => setHide(!hide)}
            style={{ textAlign: "right", paddingRight: "16px" }}
          >
            <i className="fa fa-angle-double-left" />
          </p>
        </div>
        {/*
        TODO: Add functionality in a later PR
        <div className="sidebar-section">
            <h3>Lösare</h3>
            <div className="section-list active-users">
                <p>
                    <i className="fa fa-circle" style={{ color: 'blue' }}></i>
                    Sammoa
                </p>
                <p>
                    <i className="fa fa-circle" style={{ color: 'green' }}></i>
                    Watler
                </p>
                <p>
                    <i className="fa fa-circle" style={{ color: 'red' }}></i>
                    jj_
                </p>
            </div>
        </div>
        <div className="sidebar-section link">
        <h3>Hjälp</h3>
        </div>
        */}
      </div>
    );
  }
};

export default Sidebar;
