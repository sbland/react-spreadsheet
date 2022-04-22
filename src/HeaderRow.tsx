import * as React from "react";
import * as Types from "./types";

const HeaderRow: Types.HeaderRowComponent = ({ children, width, height }) => (
  <div role="row" className="Spreadsheet__header-row" style={{ width, height }}>
    {children}
  </div>
);

export default HeaderRow;
