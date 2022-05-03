/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Spreadsheet, { Props } from "./Spreadsheet";
import * as Matrix from "./matrix";
import * as Types from "./types";
import * as Point from "./point";
import { createEmptyMatrix } from "./util";

jest.mock(
  "react-virtualized-auto-sizer",
  () =>
    ({ children }: any) =>
      children({ height: 600, width: 600 })
);

type Value = string;
type CellType = Types.CellBase<Value>;

beforeEach(() => {
  jest.clearAllMocks();
});

const ROWS = 4;
const COLUMNS = 4;
const EXAMPLE_DATA = createEmptyMatrix<CellType>(ROWS, COLUMNS);
const EXAMPLE_PROPS: Props<CellType> = {
  data: EXAMPLE_DATA,
  onChange: jest.fn(),
};
const EXAMPLE_VALUE: Value = "EXAMPLE_VALUE";
const EXAMPLE_CELL: CellType = { value: EXAMPLE_VALUE };
const EXAMPLE_MODIFIED_DATA = Matrix.set(
  Point.ORIGIN,
  EXAMPLE_CELL,
  EXAMPLE_DATA
);

beforeAll(() => {
  jest.clearAllMocks();
});

interface WrapProps {
  children: React.ReactNode;
}
const Wrap: React.FC<WrapProps> = ({ children }) => (
  <div style={{ width: 400, height: 300, outline: "1px solid red" }}>
    {children as React.ReactNode}
  </div>
);

/** React window implementation requires a sized container */
const renderWithWrap = (contents: React.ReactNode) =>
  render(<Wrap>{contents}</Wrap>);

describe("<Spreadsheet />", () => {
  test("renders", () => {
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} />);
    // Get elements
    const element = getSpreadsheetElement();
    const table = safeQuerySelector(element, "[role=table].Spreadsheet__table");
    const selected = safeQuerySelector(
      element,
      ".Spreadsheet__floating-rect--selected"
    );
    const copied = safeQuerySelector(
      element,
      ".Spreadsheet__floating-rect--copied"
    );
    // Check all sub elements are rendered correctly
    const trs = table.querySelectorAll("[role=row]");
    expect(trs).toHaveLength(ROWS + 1);
    const tds = table.querySelectorAll(
      "[role=row] [role=cell].Spreadsheet__cell"
    );
    expect(tds).toHaveLength(ROWS * COLUMNS);
    const ths = table.querySelectorAll(
      "[role=row] [role=columnheader].Spreadsheet__header"
    );
    expect(ths).toHaveLength(ROWS + COLUMNS + 1);
    // Check active cell is not rendered
    expect(element.querySelector(".Spreadsheet__active-cell")).toBeNull();
    // Make sure selected is hidden
    expect(selected).toHaveClass("Spreadsheet__floating-rect--hidden");
    // Make sure copied is hidden
    expect(copied).toHaveClass("Spreadsheet__floating-rect--hidden");
  });
  test("click activates cell", () => {
    const onActivate = jest.fn();
    const onSelect = jest.fn();
    renderWithWrap(
      <Spreadsheet
        {...EXAMPLE_PROPS}
        onActivate={onActivate}
        onSelect={onSelect}
      />
    );
    // Get elements
    const element = getSpreadsheetElement();
    const cell = safeQuerySelector(element, "[role=cell]");
    const selected = safeQuerySelector(
      element,
      ".Spreadsheet__floating-rect--selected"
    );
    // Select a cell
    fireEvent.mouseDown(cell);
    // Get active cell
    const activeCell = safeQuerySelector(element, ".Spreadsheet__active-cell");
    expect(activeCell).toHaveClass("Spreadsheet__active-cell--view");
    expect(cell.getBoundingClientRect()).toEqual(
      activeCell?.getBoundingClientRect()
    );
    // Check selected is not hidden
    expect(selected).toHaveClass("Spreadsheet__floating-rect--hidden");
    // Check onActivate is called
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith(Point.ORIGIN);
    // Check onSelect is called
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith([Point.ORIGIN]);
  });
  test("pressing Enter when a cell is active enters to edit mode", () => {
    const onModeChange = jest.fn();
    renderWithWrap(
      <Spreadsheet {...EXAMPLE_PROPS} onModeChange={onModeChange} />
    );
    // Get elements
    const element = getSpreadsheetElement();
    const cell = safeQuerySelector(element, "[role=cell]");
    // Select cell
    fireEvent.mouseDown(cell);
    // Get active cell
    const activeCell = safeQuerySelector(element, ".Spreadsheet__active-cell");
    // Press Enter
    fireEvent.keyDown(activeCell, {
      key: "Enter",
    });
    // Check mode has changed to edit
    expect(activeCell).toHaveClass("Spreadsheet__active-cell--edit");
    // Get input
    const input = safeQuerySelector(activeCell, "input");
    expect(input).toHaveFocus();
    // Check onModeChange is called
    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith("edit");
  });
  test("input triggers onChange", () => {
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} />);
    // Get elements
    const element = getSpreadsheetElement();
    const cell = safeQuerySelector(element, "[role=cell]");
    // Select cell
    fireEvent.mouseDown(cell);
    // Get active cell
    const activeCell = safeQuerySelector(element, ".Spreadsheet__active-cell");
    // Press Enter
    fireEvent.keyDown(activeCell, {
      key: "Enter",
    });
    // Get input
    const input = safeQuerySelector(activeCell, "input");
    // Change input
    fireEvent.change(input, {
      target: {
        value: EXAMPLE_VALUE,
      },
    });
    // Check onChange is called
    expect(EXAMPLE_PROPS.onChange).toBeCalledTimes(1);
    expect(EXAMPLE_PROPS.onChange).toBeCalledWith(EXAMPLE_MODIFIED_DATA);
  });
  test("handles external change of data correctly", () => {
    const { rerender } = renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} />);
    rerender(
      <Wrap>
        <Spreadsheet {...EXAMPLE_PROPS} data={EXAMPLE_MODIFIED_DATA} />
      </Wrap>
    );
    // Get text span
    const matchingElements = screen.getAllByText(EXAMPLE_CELL.value);
    expect(matchingElements).toHaveLength(1);
    const [textSpan] = matchingElements;
    // Get cell
    const cell = textSpan.parentElement;
    expectNotToBeNull(cell);
    // Get row
    const row = cell.parentElement;
    expectNotToBeNull(row);
    // Get row wrap
    const rowWrap = row.parentElement;
    expectNotToBeNull(rowWrap);
    // Make sure the cell is in the right column
    // Should be in column 1 as column 0 is the RowIndicator
    expect(getHTMLCollectionIndexOf(row.children, cell)).toBe(1);
    // Get rowContainer
    const rowContainer = rowWrap.parentElement;
    expectNotToBeNull(rowContainer);
    // Make sure the cell is in the right row
    // Should be in row 0 as the container only contains data rows
    expect(getHTMLCollectionIndexOf(rowContainer.children, rowWrap)).toBe(0);
  });
  test("renders class name", () => {
    const EXAMPLE_CLASS_NAME = "EXAMPLE_CLASS_NAME";
    renderWithWrap(
      <Spreadsheet {...EXAMPLE_PROPS} className={EXAMPLE_CLASS_NAME} />
    );
    const element = getSpreadsheetElement();
    expect(element).toHaveClass(EXAMPLE_CLASS_NAME);
  });
  test("setting hideColumnIndicators hides column indicators", () => {
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} hideColumnIndicators />);
    const ths = document.querySelectorAll(".Spreadsheet [role=columnheader]");
    expect(ths).toHaveLength(ROWS);
  });
  test("setting hideRowIndicatos hides row indicators", () => {
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} hideRowIndicators />);
    const ths = document.querySelectorAll(".Spreadsheet [role=columnheader]");
    expect(ths).toHaveLength(COLUMNS);
  });
  test("calls onKeyDown on key down", () => {
    const onKeyDown = jest.fn();
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} onKeyDown={onKeyDown} />);
    const element = getSpreadsheetElement();
    fireEvent.keyDown(element, "Enter");
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
  test("shift-click cell when a cell is activated selects a range of cells", async () => {
    const onSelect = jest.fn();
    renderWithWrap(<Spreadsheet {...EXAMPLE_PROPS} onSelect={onSelect} />);
    // Get elements
    const element = getSpreadsheetElement();

    const firstCell = safeQuerySelectorAll(element, [
      ["[role=row]", 1],
      ["[role=cell]", 0],
    ]);

    const thirdCell = safeQuerySelectorAll(element, [
      ["[role=row]", 2],
      ["[role=cell]", 1],
    ]);

    // Activate a cell
    fireEvent.mouseDown(firstCell);
    // Clear onSelect previous calls
    onSelect.mockClear();
    // Select range of cells
    fireEvent.mouseDown(thirdCell, {
      shiftKey: true,
    });

    // Check onSelect is called with the range of cells on selection
    expect(onSelect).toBeCalledTimes(1);
    expect(onSelect).toBeCalledWith([
      { row: 0, column: 0 },
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
    ]);
  });
  test("setting row labels changes row indicators labels", () => {
    const EXAMPLE_ROW_LABELS = ["A", "B", "C", "D"];
    renderWithWrap(
      <Spreadsheet {...EXAMPLE_PROPS} rowLabels={EXAMPLE_ROW_LABELS} />
    );
    const element = getSpreadsheetElement();
    // Get row label elements.
    // Do not select from first row because it only contains corner and column indicators
    const rowLabelElements = element.querySelectorAll(
      "[role=row] [role=columnheader]:not(:first-child)"
    );
    const rowLabels = Array.from(
      rowLabelElements,
      (element) => element.textContent
    );
    expect(rowLabels).toEqual(EXAMPLE_ROW_LABELS);
  });
  test("setting column labels changes column indicators labels", () => {
    const EXAMPLE_COLUMN_LABELS = ["First", "Second", "Third", "Fourth"];
    renderWithWrap(
      <Spreadsheet {...EXAMPLE_PROPS} columnLabels={EXAMPLE_COLUMN_LABELS} />
    );
    const element = getSpreadsheetElement();
    // Get column label elements.
    // Select from first row as it holds all the column indicators
    // Do not select first child as it is corner indicator
    const columnLabelElements = element.querySelectorAll(
      "[role=row] [role=columnheader]:not(:first-child)"
    );
    const columnLabels = Array.from(
      columnLabelElements,
      (element) => element.textContent
    );
    expect(columnLabels).toEqual(EXAMPLE_COLUMN_LABELS);
  });
});

/** Like .querySelector() but throws for no match */
function safeQuerySelector<T extends Element = Element>(
  node: ParentNode,
  selector: string
): T {
  const element = node.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Selector ${selector} has no matching elements`);
  }
  return element;
}

/** Like .querySelectorAll() but throws for no match
 *
 * Selector should be a list of [selector,index] tuples.
 */
function safeQuerySelectorAll<T extends Element = Element>(
  node: ParentNode,
  selectorAndIndexes: [string, number][]
): T {
  const out = selectorAndIndexes.reduce<T>((element, selectorAndIndex) => {
    const [selector, index] = selectorAndIndex;
    const elementInner = element.querySelectorAll<T>(selector);
    try {
      const el = elementInner[index];
      if (!el) throw Error(`Selector ${selector} has no matching elements`);
      return elementInner[index];
    } catch (e) {
      throw new Error(`Selector ${selector} has no matching elements`);
    }
  }, node as T);
  return out;
}

/** Wrapper for expect(actual).not.toBeNull() with type assertion */
function expectNotToBeNull<T>(
  actual: T | null | undefined
): asserts actual is T {
  expect(actual).not.toBe(null);
}

/** Like index of for HTMLCollection */
function getHTMLCollectionIndexOf(
  collection: HTMLCollection,
  element: Element
): number {
  const items = Array.from(collection);
  return items.indexOf(element);
}

function getSpreadsheetElement(): Element {
  return safeQuerySelector(document, ".Spreadsheet");
}
