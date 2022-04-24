import * as React from "react";
import classnames from "classnames";
import * as PointSet from "./point-set";
import * as PointMap from "./point-map";
import * as Matrix from "./matrix";
import * as Types from "./types";
import * as Point from "./point";
import * as Actions from "./actions";
import * as Selection from "./selection";
import { isActive, getRelativeRect } from "./util";
import useDispatch from "./use-dispatch";
import useSelector from "./use-selector";

export const Cell: React.FC<Types.CellComponentProps> = ({
  row,
  column,
  DataViewer,
  formulaParser,
  selected,
  active,
  dragging,
  mode,
  data,
  select,
  activate,
  setCellDimensions,
  containerRef,
  width,
  isScrolling,
}): React.ReactElement => {
  const rootRef = React.useRef<HTMLTableCellElement | null>(null);
  const point = React.useMemo(
    (): Point.Point => ({
      row,
      column,
    }),
    [row, column]
  );

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (mode === "view") {
        setCellDimensions(
          point,
          getRelativeRect(event.currentTarget, containerRef.current)
        );
        if (event.shiftKey) {
          select(point);
        } else {
          activate(point);
        }
      }
    },
    [mode, setCellDimensions, point, select, activate, containerRef]
  );

  const handleMouseOver = React.useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (dragging) {
        setCellDimensions(
          point,
          getRelativeRect(event.currentTarget, containerRef.current)
        );
        select(point);
      }
    },
    [setCellDimensions, select, dragging, point, containerRef]
  );

  React.useEffect(() => {
    const root = rootRef.current;
    if (selected && root && !isScrolling) {
      setCellDimensions(point, getRelativeRect(root, containerRef.current));
    }
    if (root && active && mode === "view") {
      root.focus();
    }
  }, [
    setCellDimensions,
    selected,
    active,
    mode,
    point,
    containerRef,
    isScrolling,
  ]);

  if (data && data.DataViewer) {
    // @ts-ignore
    DataViewer = data.DataViewer;
  }

  return (
    <div
      role="cell"
      ref={rootRef}
      className={classnames("Spreadsheet__cell", data?.className, {
        "Spreadsheet__cell--readonly": data?.readOnly,
      })}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
      tabIndex={0}
      style={{
        width,
      }}
    >
      <DataViewer
        row={row}
        column={column}
        cell={data}
        formulaParser={formulaParser}
      />
    </div>
  );
};

export const enhance = (
  CellComponent: React.ComponentType<Types.CellComponentProps>
): React.FC<
  Omit<
    Types.CellComponentProps,
    | "selected"
    | "active"
    | "copied"
    | "dragging"
    | "mode"
    | "data"
    | "select"
    | "activate"
    | "setCellDimensions"
  >
> => {
  return function CellWrapper(props) {
    const { row, column } = props;
    const dispatch = useDispatch();
    const select = React.useCallback(
      (point: Point.Point) => dispatch(Actions.select(point)),
      [dispatch]
    );
    const activate = React.useCallback(
      (point: Point.Point) => dispatch(Actions.activate(point)),
      [dispatch]
    );
    const setCellDimensions = React.useCallback(
      (point: Point.Point, dimensions: Types.Dimensions) =>
        dispatch(Actions.setCellDimensions(point, dimensions)),
      [dispatch]
    );
    const active = useSelector((state) =>
      isActive(state.active, {
        row,
        column,
      })
    );
    const mode = useSelector((state) => (active ? state.mode : "view"));
    const data = useSelector((state) =>
      Matrix.get({ row, column }, state.data)
    );
    const selected = useSelector((state) =>
      Selection.hasPoint(state.selected, state.data, { row, column })
    );
    const dragging = useSelector((state) => state.dragging);
    const copied = useSelector((state) =>
      PointMap.has({ row, column }, state.copied)
    );

    // Use only to trigger re-render when cell bindings change
    useSelector((state) => {
      const point = { row, column };
      const cellBindings = PointMap.get(point, state.bindings);
      return cellBindings &&
        state.lastChanged &&
        PointSet.has(cellBindings, state.lastChanged)
        ? {}
        : null;
    });

    return (
      <CellComponent
        {...props}
        selected={selected}
        active={active}
        copied={copied}
        dragging={dragging}
        mode={mode}
        data={data}
        select={select}
        activate={activate}
        setCellDimensions={setCellDimensions}
      />
    );
  };
};
