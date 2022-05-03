/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import Table from "./Table";

describe("<Table />", () => {
  test("renders empty table", () => {
    const ref = { current: {} } as React.RefObject<HTMLElement>;
    render(
      <Table innerRef={ref} columns={0}>
        {null}
      </Table>
    );
    expect(
      document.querySelectorAll(
        ".Spreadsheet__table .colgroup .Spreadsheet__columnNode"
      ).length
    ).toBe(1);
    expect(
      document.querySelectorAll(".Spreadsheet__table .Spreadsheet_body").length
    ).toBe(1);
  });
  test("renders table with content", () => {
    const ref = { current: {} } as React.RefObject<HTMLElement>;
    render(
      <Table innerRef={ref} columns={0}>
        {<div role="row" id="exampleRow" />}
      </Table>
    );
    expect(
      document.querySelectorAll(
        ".Spreadsheet__table .Spreadsheet_body #exampleRow"
      ).length
    ).toBe(1);
  });
  test("renders empty table with no cols if hideColumnIndicators is set", () => {
    const ref = { current: {} } as React.RefObject<HTMLElement>;
    render(
      <Table innerRef={ref} columns={0} hideColumnIndicators>
        {null}
      </Table>
    );
    expect(
      document.querySelectorAll(
        ".Spreadsheet__table .colgroup .Spreadsheet__columnNode"
      ).length
    ).toBe(0);
  });
  test("renders columns according to given prop", () => {
    const columns = 1;
    const ref = { current: {} } as React.RefObject<HTMLElement>;
    render(
      <Table innerRef={ref} columns={columns}>
        {null}
      </Table>
    );
    expect(
      document.querySelectorAll(
        ".Spreadsheet__table .colgroup .Spreadsheet__columnNode"
      ).length
    ).toBe(columns + 1);
  });
});
