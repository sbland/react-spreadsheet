/** Get the index attribute from all rows in row container */
export const getVisibleElements = (rowContainer: HTMLElement): number[] => {
  const visibleItems = Array.from(rowContainer.children[0].children).map(
    (child) => parseInt(child.getAttribute("data-itemindex") || "")
  );
  return visibleItems;
};
