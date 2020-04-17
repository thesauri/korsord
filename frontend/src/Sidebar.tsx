import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import styled from "styled-components";

import "./Sidebar.css";

import { EditMode } from "./Crossword";

interface SidebarProps {
  mode: EditMode;
  setMode: (arg: EditMode) => void;
  brushSize: number;
  setBrushSize: (arg: number) => void;
}

const InputRangeWithLabelDiv = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  margin: 0 16px;
  label {
    color: var(--dark-gray);
    font-weight: 600;
    cursor: pointer;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  margin-top: 5px;
  input[type="number"] {
    width: 25%;
    min-width: 40px;
  }
  input[type="range"] {
    width: 50%;
    margin: auto;
  }
`;

interface RangeWithLabelProps {
  label: string;
  value: number;
  updateValue: (arg: number) => void;
  min?: number;
  max?: number;
}

const InputRangeWithLabel: React.FC<RangeWithLabelProps> = (props) => {
  const [textInputValue, setTextInputValue] = useState(props.value);

  useEffect(() => {
    setTextInputValue(props.value);
  }, [props.value]);

  const min = Math.floor(props.min || 0);
  const max = Math.ceil(props.max || 8);
  const stepSize = props.value <= 1 ? 0.25 : props.value <= 2.5 ? 0.5 : 1;

  const updateValue = (val: string) => {
    props.updateValue(Math.max(min, parseFloat(val)));
  };

  return (
    <InputRangeWithLabelDiv>
      <label>
        {props.label}
        <InputWrapper>
          <input
            type="number"
            value={textInputValue}
            min={min}
            max={max}
            step={stepSize}
            onChange={(e) => {
              if (parseFloat(e.target.value) !== undefined) {
                // if input string is a valid number, update it
                updateValue(e.target.value);
              }
              setTextInputValue(parseFloat(e.target.value));
            }}
            onBlur={(e) => {
              if (parseFloat(e.target.value)) updateValue(e.target.value);
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={stepSize}
            value={props.value}
            onChange={(e) => updateValue(e.target.value)}
          />
        </InputWrapper>
      </label>
    </InputRangeWithLabelDiv>
  );
};

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
            <InputRangeWithLabel
              label={"Linjebredd"}
              value={props.brushSize}
              updateValue={props.setBrushSize}
            />
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
