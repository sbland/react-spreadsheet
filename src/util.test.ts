/**
 * @jest-environment jsdom
 */

import type { Parser as FormulaParser } from "hot-formula-parser";
import * as Formula from "./formula";
import * as Matrix from "./matrix";
import * as Point from "./point";
import * as PointMap from "./point-map";
import * as PointRange from "./point-range";
import * as Types from "./types";
import * as util from "./util";

const EXAMPLE_INPUT_VALUE = "EXAMPLE_INPUT_VALUE";
const EXAMPLE_DATA_ROWS_COUNT = 4;
const EXAMPLE_DATA_COLUMNS_COUNT = 4;
const EXAMPLE_DATA = Matrix.createEmpty<Types.CellBase>(
  EXAMPLE_DATA_ROWS_COUNT,
  EXAMPLE_DATA_COLUMNS_COUNT
);
const EXAMPLE_ROW_LABELS = ["Foo", "Bar", "Baz", "Row", "Far"];
const EXAMPLE_COLUMN_LABELS = ["Foo", "Bar", "Baz", "Row", "Far"];
const EXAMPLE_EXISTING_POINT = Point.ORIGIN;
const EXAMPLE_NON_EXISTING_POINT: Point.Point = {
  row: EXAMPLE_DATA_ROWS_COUNT,
  column: EXAMPLE_DATA_COLUMNS_COUNT,
};
const EXAMPLE_CELL_HEIGHT = 20;
const EXAMPLE_CELL_WIDTH = 200;

const EXAMPLE_CELL_DIMENSIONS: Types.Dimensions = {
  height: EXAMPLE_CELL_HEIGHT,
  width: EXAMPLE_CELL_WIDTH,
  top: 0,
  left: 0,
};

const EXAMPLE_COLUMN_DIMENSIONS = Array.from(
  Array(EXAMPLE_DATA_COLUMNS_COUNT)
).reduce(
  (acc, _, i) => ({
    ...acc,
    [i]: {
      width: EXAMPLE_CELL_DIMENSIONS.width,
      left: EXAMPLE_CELL_DIMENSIONS.left + EXAMPLE_CELL_DIMENSIONS.width * i,
    },
  }),
  {}
);
const EXAMPLE_ROW_DIMENSIONS = Array.from(
  Array(EXAMPLE_DATA_ROWS_COUNT)
).reduce(
  (acc, _, i) => ({
    ...acc,
    [i]: {
      height: EXAMPLE_CELL_DIMENSIONS.height,
      top: EXAMPLE_CELL_DIMENSIONS.top + EXAMPLE_CELL_DIMENSIONS.height * i,
    },
  }),
  {}
);
const EXAMPLE_STATE: Types.StoreState = {
  active: null,
  mode: "view",
  rowDimensions: EXAMPLE_ROW_DIMENSIONS,
  columnDimensions: EXAMPLE_COLUMN_DIMENSIONS,
  visibleBoundary: {
    start: { column: 0, row: 0 },
    end: {
      column: EXAMPLE_DATA_COLUMNS_COUNT - 1,
      row: EXAMPLE_DATA_ROWS_COUNT - 1,
    },
  },
  lastChanged: null,
  hasPasted: false,
  cut: false,
  dragging: false,
  data: EXAMPLE_DATA,
  selected: null,
  copied: PointMap.from([]),
  bindings: PointMap.from([]),
  lastCommit: null,
  isScrolling: false,
};
const EXAMPLE_STRING = "EXAMPLE_STRING";
const EXAMPLE_CELL: Types.CellBase = {
  value: "EXAMPLE_CELL_VALUE",
};
const EXAMPLE_FORMULA_CELL: Types.CellBase = {
  value: "=TRUE()",
};
const MOCK_PARSE = jest.fn();
const MOCK_FORMULA_PARSER = {
  parse: MOCK_PARSE,
} as unknown as FormulaParser;
const EXAMPLE_FORMULA_RESULT = true;
const EXAMPLE_FORMULA_ERROR = "EXAMPLE_ERROR";
const EXAMPLE_EMPTY_COPIED = PointMap.from<Types.CellBase>([]);
const EXAMPLE_COPIED = PointMap.from([[Point.ORIGIN, EXAMPLE_CELL]]);

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("moveCursorToEnd()", () => {
  test("moves cursor to the end", () => {
    const el = document.createElement("input");
    el.value = EXAMPLE_INPUT_VALUE;
    util.moveCursorToEnd(el);
    expect(el.selectionStart).toBe(EXAMPLE_INPUT_VALUE.length);
    expect(el.selectionEnd).toBe(EXAMPLE_INPUT_VALUE.length);
  });
});

describe("range()", () => {
  test("basic use of range", () => {
    const end = 10;
    const start = 1;
    const step = 2;
    const res = util.range(end, start, step);

    expect(res).toEqual([1, 3, 5, 7, 9]);
  });

  test("range with negative numbers", () => {
    const end = 10;
    const start = -10;
    const step = 2;

    const res = util.range(end, start, step);

    expect(res).toEqual([-10, -8, -6, -4, -2, 0, 2, 4, 6, 8]);
  });

  test("range with larger start to return decreasing series", () => {
    const end = 1;
    const start = 5;
    const res = util.range(end, start);

    expect(res).toEqual([5, 4, 3, 2]);
  });
});

describe("calculateSpreadsheetSize()", () => {
  test("Returns the size of data if row labels and column labels are not defined", () => {
    expect(util.calculateSpreadsheetSize(EXAMPLE_DATA)).toStrictEqual({
      rows: EXAMPLE_DATA_ROWS_COUNT,
      columns: EXAMPLE_DATA_COLUMNS_COUNT,
    });
  });

  test("Returns the size of row labels if row labels is longer than data rows", () => {
    expect(
      util.calculateSpreadsheetSize(EXAMPLE_DATA, EXAMPLE_ROW_LABELS)
    ).toStrictEqual({
      rows: EXAMPLE_ROW_LABELS.length,
      columns: EXAMPLE_DATA_COLUMNS_COUNT,
    });
  });

  test("Returns the size of column labels if column labels is longer than data columns", () => {
    expect(
      util.calculateSpreadsheetSize(
        EXAMPLE_DATA,
        undefined,
        EXAMPLE_COLUMN_LABELS
      )
    ).toStrictEqual({
      rows: EXAMPLE_DATA_ROWS_COUNT,
      columns: EXAMPLE_COLUMN_LABELS.length,
    });
  });
});

describe("getCellDimensions()", () => {
  const cases = [
    [
      "returns existing cell dimensions",
      EXAMPLE_EXISTING_POINT,
      EXAMPLE_CELL_DIMENSIONS,
    ],
    [
      "returns undefined for non existing cell",
      EXAMPLE_NON_EXISTING_POINT,
      undefined,
    ],
  ] as const;
  test.each(cases)("%s", (name, point, expected) => {
    expect(
      util.getCellDimensions(
        point,
        EXAMPLE_STATE.rowDimensions,
        EXAMPLE_STATE.columnDimensions,
        EXAMPLE_STATE.visibleBoundary
      )
    ).toEqual(expected);
  });
});

describe("getRangeDimensions()", () => {
  const cases = [
    // TODO: Check these test
    // [
    //   "returns undefined for non existing start",
    //   { start: EXAMPLE_NON_EXISTING_POINT, end: EXAMPLE_EXISTING_POINT },
    //   undefined,
    // ],
    // [
    //   "returns undefined for non existing end",
    //   { start: EXAMPLE_EXISTING_POINT, end: EXAMPLE_NON_EXISTING_POINT },
    //   undefined,
    // ],
    // [
    //   "returns undefined for non existing start and end",
    //   { start: EXAMPLE_NON_EXISTING_POINT, end: EXAMPLE_NON_EXISTING_POINT },
    //   undefined,
    // ],
    [
      "returns dimensions of range of one cell",
      { start: EXAMPLE_EXISTING_POINT, end: EXAMPLE_EXISTING_POINT },
      EXAMPLE_CELL_DIMENSIONS,
    ],
    [
      "returns dimensions of range of two horizontal cells",
      { start: Point.ORIGIN, end: { row: 0, column: 1 } },
      {
        ...EXAMPLE_CELL_DIMENSIONS,
        width: EXAMPLE_CELL_DIMENSIONS.width * 2,
      },
    ],
    [
      "returns dimensions of range of two vertical cells",
      { start: Point.ORIGIN, end: { row: 1, column: 0 } },
      {
        ...EXAMPLE_CELL_DIMENSIONS,
        height: EXAMPLE_CELL_DIMENSIONS.height * 2,
      },
    ],
    [
      "returns dimensions of range of a square of cells",
      { start: Point.ORIGIN, end: { row: 1, column: 1 } },
      {
        ...EXAMPLE_CELL_DIMENSIONS,
        width: EXAMPLE_CELL_DIMENSIONS.width * 2,
        height: EXAMPLE_CELL_DIMENSIONS.height * 2,
      },
    ],
  ] as const;
  test.each(cases)("%s", (name, range, expected) => {
    // TODO: Test  with visibleBoundary
    expect(
      util.getRangeDimensions(
        EXAMPLE_STATE.rowDimensions,
        EXAMPLE_STATE.columnDimensions,
        EXAMPLE_STATE.visibleBoundary,
        range
      )
    ).toEqual(expected);
  });
});
describe("getRangeDimensions() - restricted visible boundary", () => {
  const EXAMPLE_RESTRICTED_BOUNDARY = {
    start: { column: 1, row: 1 },
    end: {
      column: 3,
      row: 3,
    },
  } as PointRange.PointRange;

  const EXAMPLE_RESTRICTED_BOUNDARY_DIMENSIONS = {
    top: 20,
    left: 200,
    width: 600,
    height: 60,
  };

  // TODO: Test visible boundary
  const cases = [
    [
      "returns undefined if cell outside visible boundary",
      {
        start: {
          row: 0,
          column: 0,
        },
        end: { row: 0, column: 0 },
      },
      undefined,
    ],
    [
      "returns undefined if selection outside visible boundary",
      {
        start: {
          row: 9998,
          column: 9998,
        },
        end: { row: 9999, column: 9999 },
      },
      undefined,
    ],
    [
      "returns dimensions of range of one cell inside visible boundary",
      {
        start: EXAMPLE_RESTRICTED_BOUNDARY.start,
        end: EXAMPLE_RESTRICTED_BOUNDARY.start,
      },
      {
        ...EXAMPLE_CELL_DIMENSIONS,
        left: EXAMPLE_RESTRICTED_BOUNDARY_DIMENSIONS.left,
        top: EXAMPLE_RESTRICTED_BOUNDARY_DIMENSIONS.top,
      },
    ],
    [
      "returns dimensions of range of selection inside visible boundary",
      EXAMPLE_RESTRICTED_BOUNDARY,
      EXAMPLE_RESTRICTED_BOUNDARY_DIMENSIONS,
    ],
    [
      "returns dimensions of range of selection crossing visible boundary - column",
      {
        ...EXAMPLE_RESTRICTED_BOUNDARY,
        end: {
          ...EXAMPLE_RESTRICTED_BOUNDARY.end,
          column: EXAMPLE_RESTRICTED_BOUNDARY.end.column + 1,
        },
      },
      EXAMPLE_RESTRICTED_BOUNDARY_DIMENSIONS,
    ],
  ] as const;
  test.each(cases)("%s", (name, range, expected) => {
    expect(
      util.getRangeDimensions(
        EXAMPLE_STATE.rowDimensions,
        EXAMPLE_STATE.columnDimensions,
        EXAMPLE_RESTRICTED_BOUNDARY,
        range
      )
    ).toEqual(expected);
  });
});

describe("getSelectedDimensions()", () => {
  const cases = [
    [
      "point range",
      PointRange.create(Point.ORIGIN, Point.ORIGIN),
      util.getRangeDimensions(
        EXAMPLE_STATE.rowDimensions,
        EXAMPLE_STATE.columnDimensions,
        EXAMPLE_STATE.visibleBoundary,
        PointRange.create(Point.ORIGIN, Point.ORIGIN)
      ),
    ],
    ["no selection", null, undefined],
  ] as const;
  test.each(cases)("%s", (name, selection, expected) => {
    expect(
      util.getSelectedDimensions(
        EXAMPLE_STATE.rowDimensions,
        EXAMPLE_STATE.columnDimensions,
        EXAMPLE_STATE.visibleBoundary,
        EXAMPLE_STATE.data,
        selection
      )
    ).toEqual(expected);
  });
});

describe("isActive()", () => {
  const cases = [
    ["returns false if active is null", null, EXAMPLE_EXISTING_POINT, false],
    [
      "returns false if given point is not null",
      { row: 1, column: 1 },
      EXAMPLE_EXISTING_POINT,
      false,
    ],
    [
      "returns true if given point is active",
      EXAMPLE_EXISTING_POINT,
      EXAMPLE_EXISTING_POINT,
      true,
    ],
  ] as const;
  test.each(cases)("%s", (name, active, point, expected) => {
    expect(util.isActive(active, point)).toBe(expected);
  });
});

describe("writeTextToClipboard()", () => {
  const event = {
    clipboardData: {
      setData: jest.fn(),
    },
  };
  util.writeTextToClipboard(event as unknown as ClipboardEvent, EXAMPLE_STRING);
  expect(event.clipboardData.setData).toBeCalledTimes(1);
  expect(event.clipboardData.setData).toBeCalledWith(
    util.PLAIN_TEXT_MIME,
    EXAMPLE_STRING
  );
});

describe("getComputedValue()", () => {
  test("Returns null if cell is not defined", () => {
    expect(
      util.getComputedValue({
        cell: undefined,
        formulaParser: MOCK_FORMULA_PARSER,
      })
    ).toBe(null);
    expect(MOCK_FORMULA_PARSER.parse).toBeCalledTimes(0);
  });
  test("Returns value if not formula", () => {
    expect(
      util.getComputedValue({
        cell: EXAMPLE_CELL,
        formulaParser: MOCK_FORMULA_PARSER,
      })
    ).toBe(EXAMPLE_CELL.value);
    expect(MOCK_FORMULA_PARSER.parse).toBeCalledTimes(0);
  });
  test("Returns evaluated formula value", () => {
    MOCK_PARSE.mockImplementationOnce(() => ({
      result: EXAMPLE_FORMULA_RESULT,
      error: null,
    }));
    expect(
      util.getComputedValue({
        cell: EXAMPLE_FORMULA_CELL,
        formulaParser: MOCK_FORMULA_PARSER,
      })
    ).toBe(EXAMPLE_FORMULA_RESULT);
  });
});

describe("getFormulaComputedValue()", () => {
  const cases = [
    [
      "Returns parsed formula result",
      EXAMPLE_FORMULA_RESULT,
      { result: EXAMPLE_FORMULA_RESULT, error: null },
    ],
    [
      "Returns parsed formula error",
      EXAMPLE_FORMULA_ERROR,
      { result: null, error: EXAMPLE_FORMULA_ERROR },
    ],
  ] as const;
  test.each(cases)("%s", (name, expected, mockParseReturn) => {
    MOCK_PARSE.mockImplementationOnce(() => mockParseReturn);
    expect(
      util.getFormulaComputedValue({
        cell: EXAMPLE_FORMULA_CELL,
        formulaParser: MOCK_FORMULA_PARSER,
      })
    ).toBe(expected);
    expect(MOCK_FORMULA_PARSER.parse).toBeCalledTimes(1);
    expect(MOCK_FORMULA_PARSER.parse).toBeCalledWith(
      Formula.extractFormula(EXAMPLE_FORMULA_CELL.value)
    );
  });
});

describe("isFormulaCell()", () => {
  const cases = [
    ["Returns true for formula cell", EXAMPLE_FORMULA_CELL, true],
    ["Returns true for formula cell", EXAMPLE_CELL, false],
  ] as const;
  test.each(cases)("%s", (name, cell, expected) => {
    expect(util.isFormulaCell(cell)).toBe(expected);
  });
});

describe("getCSV()", () => {
  test("Returns given data as CSV", () => {
    expect(util.getCSV(EXAMPLE_DATA)).toBe(
      Matrix.join(
        Matrix.createEmpty(EXAMPLE_DATA_ROWS_COUNT, EXAMPLE_DATA_COLUMNS_COUNT)
      )
    );
  });
});

describe("getOffsetRect()", () => {
  test("Returns object with the offsets of the given element", () => {
    const MOCK_ELEMENT = {
      offsetWidth: 42,
      offsetHeight: 42,
      offsetLeft: 42,
      offsetTop: 42,
    } as unknown as HTMLElement;
    expect(util.getOffsetRect(MOCK_ELEMENT)).toEqual({
      width: MOCK_ELEMENT.offsetWidth,
      height: MOCK_ELEMENT.offsetHeight,
      left: MOCK_ELEMENT.offsetLeft,
      top: MOCK_ELEMENT.offsetTop,
    });
  });
});

describe("getRelativeRect", () => {
  test("Returns object with element position relative to parent", () => {
    const MOCK_ELEMENT = {
      offsetWidth: 5,
      offsetHeight: 10,
      getBoundingClientRect: () => ({
        left: 20,
        top: 30,
      }),
    } as unknown as HTMLElement;
    const MOCK_PARENT_ELEMENT = {
      offsetWidth: 42,
      offsetHeight: 42,
      scrollLeft: 10,
      getBoundingClientRect: () => ({
        left: 5,
        top: 10,
      }),
    } as unknown as HTMLElement;

    expect(util.getRelativeRect(MOCK_ELEMENT, MOCK_PARENT_ELEMENT)).toEqual({
      width: 5,
      height: 10,
      left: 25,
      top: 20,
    });
  });
});

describe("readTextFromClipboard()", () => {
  test("Returns empty string if no text is defined", () => {
    const EXAMPLE_CLIPBOARD_EVENT = {} as ClipboardEvent;
    expect(util.readTextFromClipboard(EXAMPLE_CLIPBOARD_EVENT)).toEqual("");
  });
  test("Returns string from event", () => {
    const EXAMPLE_CLIPBOARD_EVENT = {
      clipboardData: {
        getData: jest.fn(() => EXAMPLE_STRING),
      },
    } as unknown as ClipboardEvent;
    expect(util.readTextFromClipboard(EXAMPLE_CLIPBOARD_EVENT)).toEqual(
      EXAMPLE_STRING
    );
    expect(EXAMPLE_CLIPBOARD_EVENT.clipboardData?.getData).toBeCalledTimes(1);
    expect(EXAMPLE_CLIPBOARD_EVENT.clipboardData?.getData).toBeCalledWith(
      util.PLAIN_TEXT_MIME
    );
  });
  test("Returns string from window", () => {
    const EXAMPLE_CLIPBOARD_EVENT = {} as ClipboardEvent;
    const MOCK_CLIPBOARD_DATA = {
      getData: jest.fn(() => EXAMPLE_STRING),
    };
    // Define for the test as it is not a native JS-DOM property
    // @ts-ignore
    window.clipboardData = MOCK_CLIPBOARD_DATA;
    expect(util.readTextFromClipboard(EXAMPLE_CLIPBOARD_EVENT)).toBe(
      EXAMPLE_STRING
    );
    // @ts-ignore
    expect(MOCK_CLIPBOARD_DATA.getData).toBeCalledTimes(1);
    expect(MOCK_CLIPBOARD_DATA.getData).toBeCalledWith("Text");
    // Undefine as it is not a native JS-DOM property
    // @ts-ignore
    delete window.clipoardData;
  });
});

describe("getCopiedRange()", () => {
  const cases = [
    [
      "Returns range of copied cells",
      EXAMPLE_COPIED,
      false,
      PointRange.create(Point.ORIGIN, Point.ORIGIN),
    ],
    ["Returns null if none is copied", EXAMPLE_EMPTY_COPIED, false, null],
    ["Returns null if hasPasted is true", EXAMPLE_COPIED, true, null],
  ] as const;
  test.each(cases)("%s", (name, copied, hasPasted, expected) => {
    expect(util.getCopiedRange(copied, hasPasted)).toEqual(expected);
  });
});

describe("transformCoordToPoint()", () => {
  test("transforms coord to point", () => {
    expect(
      util.transformCoordToPoint({
        row: { index: Point.ORIGIN.row },
        column: { index: Point.ORIGIN.column },
      })
    ).toEqual(Point.ORIGIN);
  });
});

describe("getCellValue()", () => {
  expect(
    util.getCellValue(MOCK_FORMULA_PARSER, EXAMPLE_DATA, Point.ORIGIN)
  ).toEqual(null);
});

describe("getCellRangeValue()", () => {
  expect(
    util.getCellRangeValue(
      MOCK_FORMULA_PARSER,
      EXAMPLE_DATA,
      Point.ORIGIN,
      Point.ORIGIN
    )
  ).toEqual([null]);
});

describe("shouldHandleClipboardEvent()", () => {
  const matchesMock = jest.fn();
  const mockElement = {
    matches: matchesMock,
  } as unknown as Element;
  const cases = [
    ["return false if root is null", null, false, "view" as Types.Mode, false],
    [
      "return false if mode is not view",
      mockElement,
      false,
      "edit" as Types.Mode,
      false,
    ],
    [
      "return true if root is focused within and mode is view",
      mockElement,
      true,
      "view" as Types.Mode,
      true,
    ],
  ] as const;
  beforeEach(() => {
    // Prevent accumulation return values
    matchesMock.mockReset();
  });
  test.each(cases)("%s", (name, root, focusedWithin, mode, expected) => {
    // Bound to implemnetation of isFocusedWithin()
    matchesMock.mockReturnValueOnce(focusedWithin);
    expect(util.shouldHandleClipboardEvent(root, mode)).toBe(expected);
  });
});

describe("isFocusedWithin()", () => {
  const matchesMock = jest.fn();
  const mockElement = {
    matches: matchesMock,
  } as unknown as Element;
  const cases = [
    ["matches selector", mockElement, true, true],
    ["does not match selector", mockElement, false, false],
  ] as const;
  test.each(cases)("%s", (name, element, matches, expected) => {
    matchesMock.mockReturnValueOnce(matches);
    expect(util.isFocusedWithin(element)).toBe(expected);
    expect(matchesMock).toBeCalledTimes(1);
    expect(matchesMock).toBeCalledWith(util.FOCUS_WITHIN_SELECTOR);
  });
});
