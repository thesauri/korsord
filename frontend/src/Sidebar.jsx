import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import {DRAW, WRITE, ERASE} from "./Crossword.jsx";


const Sidebar = (props) => {    
    return (
      <div className="sidebar">
        <Link to={""} style={{textDecoration: 'none'}}>
            <div className="sidebar-header sidebar-section">
                <h3 className="sidebar-header-text">
                    Fredagskorsord
                </h3> 
            </div>
        </Link>
        <div className="sidebar-section">
            <h3>Verktyg</h3>
            <div className="section-list tools">
                <p className={props.mode === DRAW ? "active" : ""} onClick={() => props.setMode(DRAW)}>
                    <i className="fas fa-pen"></i>
                    Penna (B)
                </p>
                <p className={props.mode === ERASE ? "active": ""} onClick={() => props.setMode(ERASE)}>
                    <i className="fas fa-eraser" id="erase"></i>
                    Suddgummi (E)
                </p>
                <p className={props.mode === WRITE ? "active" : ""} onClick={() => props.setMode(WRITE)}>
                    <i className="fas fa-font" id="write"></i>
                    Text {props.mode === WRITE ? "(ESC to exit)" : "(Enter)"}
                </p>
            </div>    
        </div>
        { /* 
        TODO: Add functionality in a later PR
        <div className="sidebar-section">
            <h3>Lösare</h3>
            <div className="section-list active-users">
                <p>
                    <i className="fas fa-circle" style={{ color: 'blue' }}></i>
                    Sammoa
                </p>
                <p>
                    <i className="fas fa-circle" style={{ color: 'green' }}></i>
                    Watler
                </p>
                <p>
                    <i className="fas fa-circle" style={{ color: 'red' }}></i>
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
  };
  
  export default Sidebar;