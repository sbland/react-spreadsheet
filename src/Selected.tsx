import * as React from "react";
import * as Selection from "./selection";
import { getSelectedDimensions } from "./util";
import FloatingRect from "./FloatingRect";
import useSelector from "./use-selector";

const Selected: React.FC = () => {
  const selected = useSelector((state) => state.selected);
  const dimensions = useSelector(
    (state) =>
      selected &&
      getSelectedDimensions(
        state.rowDimensions,
        state.columnDimensions,
        state.visibleBoundary,
        state.data,
        state.selected
      )
  );
  const dragging = useSelector((state) => state.dragging);
  const hidden = useSelector(
    (state) => Selection.size(state.selected, state.data) < 2
  );
  const isScrolling = useSelector((state) => state.isScrolling);
  return (
    <FloatingRect
      variant="selected"
      dimensions={dimensions}
      dragging={dragging}
      hidden={hidden || isScrolling}
    />
  );
};

export default Selected;
