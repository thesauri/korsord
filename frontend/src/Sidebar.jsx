import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
    return (
      <div className="sidebar">
        <div className="sidebar-section">
            <h3>Fredagskorsord</h3>
        </div>
        <div className="sidebar-section">
            <h3>Verktyg</h3>
            <div className="section-list tools">
                <p className="active">
                    <i className="fas fa-pen"></i>
                    Penna (B)
                </p>
                <p>
                    <i className="fas fa-eraser" style={{ color: 'black' }}></i>
                    Suddgummi (E)
                </p>
                <p>
                    <i className="fas fa-text" style={{ color: 'black' }}></i>
                    Text (T)
                </p>
            </div> 
            
        </div>
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
            <h3>Hjälp<i className="fas fa-pen"></i></h3>
        </div>
      </div>
    );
  };
  
  export default Sidebar;