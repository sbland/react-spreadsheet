import * as React from "react";
import { Story, Meta } from "@storybook/react/types-6-0";
import { createEmptyMatrix, Spreadsheet, Props, CellBase } from "..";
import * as Matrix from "../matrix";
import { AsyncCellDataEditor, AsyncCellDataViewer } from "./AsyncCellData";
import CustomCell from "./CustomCell";
import { RangeEdit, RangeView } from "./RangeDataComponents";
import { SelectEdit, SelectView } from "./SelectDataComponents";
import { CustomCornerIndicator } from "./CustomCornerIndicator";

type StringCell = CellBase<string | undefined>;
type NumberCell = CellBase<number | undefined>;

const INITIAL_ROWS = 1000;
const INITIAL_COLUMNS = 4;
const EMPTY_DATA = createEmptyMatrix<StringCell>(INITIAL_ROWS, INITIAL_COLUMNS);

export default {
  title: "Spreadsheet",
  component: Spreadsheet,
  args: {
    data: EMPTY_DATA,
  },
} as Meta<Props<StringCell>>;

interface StoryWrapProps {
  children: React.ReactNode;
}

const StoryWrap: React.FC<StoryWrapProps> = ({ children }) => (
  <div style={{ width: 400, height: 300, outline: "1px solid red" }}>
    {children as React.ReactNode}
  </div>
);

export const Basic: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet {...props} />
  </StoryWrap>
);

export const DarkMode: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet {...props} darkMode />
  </StoryWrap>
);

export const Controlled: Story<Props<StringCell>> = (props) => {
  const [data, setData] = React.useState(EMPTY_DATA);

  const addColumn = React.useCallback(
    () =>
      setData((data) =>
        data.map((row) => {
          const nextRow = [...row];
          nextRow.length += 1;
          return nextRow;
        })
      ),
    [setData]
  );

  const removeColumn = React.useCallback(() => {
    setData((data) =>
      data.map((row) => {
        return row.slice(0, row.length - 1);
      })
    );
  }, [setData]);

  const addRow = React.useCallback(
    () =>
      setData((data) => {
        const { columns } = Matrix.getSize(data);
        return [...data, Array(columns)];
      }),
    [setData]
  );

  const removeRow = React.useCallback(() => {
    setData((data) => {
      return data.slice(0, data.length - 1);
    });
  }, [setData]);

  return (
    <>
      <div>
        <button onClick={addColumn}>Add column</button>
        <button onClick={addRow}>Add row</button>
        <button onClick={removeColumn}>Remove column</button>
        <button onClick={removeRow}>Remove row</button>
      </div>
      <StoryWrap>
        <Spreadsheet {...props} data={data} onChange={setData} />
      </StoryWrap>
    </>
  );
};

export const CustomRowLabels: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet
      {...props}
      rowLabels={["Dan", "Alice", "Bob", "Steve", "Adam", "Ruth"]}
    />
  </StoryWrap>
);

export const CustomColumnLabels: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet
      {...props}
      columnLabels={["Name", "Age", "Email", "Address"]}
    />
  </StoryWrap>
);

export const HideIndicators: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet {...props} hideColumnIndicators hideRowIndicators />
  </StoryWrap>
);

export const Readonly: Story<Props<StringCell>> = (props) => {
  const data = createEmptyMatrix<StringCell>(INITIAL_ROWS, INITIAL_COLUMNS);
  data[0][0] = { readOnly: true, value: "Read Only" };
  return (
    <StoryWrap>
      <Spreadsheet {...props} data={data} />;
    </StoryWrap>
  );
};

export const WithAsyncCellData: Story<Props<StringCell>> = (props) => {
  const data = createEmptyMatrix<StringCell>(INITIAL_ROWS, INITIAL_COLUMNS);

  data[2][2] = {
    value: undefined,
    DataViewer: AsyncCellDataViewer,
    DataEditor: AsyncCellDataEditor,
  };
  return (
    <StoryWrap>
      <Spreadsheet {...props} data={data} />;
    </StoryWrap>
  );
};

export const WithCustomCell: Story<Props<CellBase>> = (props) => (
  <StoryWrap>
    <Spreadsheet {...props} Cell={CustomCell} />
  </StoryWrap>
);

export const RangeCell: Story<Props<NumberCell>> = (props) => {
  const data = createEmptyMatrix<NumberCell>(INITIAL_ROWS, INITIAL_COLUMNS);
  data[2][2] = {
    value: 0,
    DataViewer: RangeView,
    DataEditor: RangeEdit,
  };
  return (
    <StoryWrap>
      <Spreadsheet {...props} data={data} />
    </StoryWrap>
  );
};

export const WithSelectCell: Story<Props<StringCell>> = (props) => {
  const data = createEmptyMatrix<StringCell>(INITIAL_ROWS, INITIAL_COLUMNS);

  data[2][2] = {
    value: undefined,
    DataViewer: SelectView,
    DataEditor: SelectEdit,
    className: "select-cell",
  };
  return (
    <StoryWrap>
      <Spreadsheet {...props} data={data} />
    </StoryWrap>
  );
};

export const WithCornerIndicator: Story<Props<StringCell>> = (props) => (
  <StoryWrap>
    <Spreadsheet {...props} CornerIndicator={CustomCornerIndicator} />
  </StoryWrap>
);

export const Filter: Story<Props<StringCell>> = (props) => {
  const [data, setData] = React.useState(
    EMPTY_DATA as Matrix.Matrix<StringCell>
  );
  const [filter, setFilter] = React.useState("");

  const handleFilterChange = React.useCallback(
    (event) => {
      const nextFilter = event.target.value;
      setFilter(nextFilter);
    },
    [setFilter]
  );

  /**
   * Removes cells not matching the filter from matrix while maintaining the
   * minimum size that includes all of the matching cells.
   */
  const filtered = React.useMemo(() => {
    if (filter.length === 0) {
      return data;
    }
    const filtered: Matrix.Matrix<StringCell> = [];
    for (let row = 0; row < data.length; row++) {
      if (data.length !== 0) {
        for (let column = 0; column < data[0].length; column++) {
          const cell = data[row][column];
          if (cell && cell.value && cell.value.includes(filter)) {
            if (!filtered[0]) {
              filtered[0] = [];
            }
            if (filtered[0].length < column) {
              filtered[0].length = column + 1;
            }
            if (!filtered[row]) {
              filtered[row] = [];
            }
            filtered[row][column] = cell;
          }
        }
      }
    }
    return filtered;
  }, [data, filter]);

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Filter"
          value={filter}
          onChange={handleFilterChange}
        />
      </div>
      <StoryWrap>
        <Spreadsheet {...props} data={filtered} onChange={setData} />
      </StoryWrap>
    </>
  );
};
