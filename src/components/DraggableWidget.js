import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

function DraggableWidget({
  widget,
  index,
  moveWidget,
  widgetSize,
  isMinimized,
  isCustomSize,
  customWidth,
  customHeight,
  customColumnSpan,
  onResize,
  onRemove,
  isEditMode,
  handleSizeChange,
  getFieldIcon,
  renderWidgetContent,
}) {
  // Setup drag source for the widget
  const [{ isDragging }, drag] = useDrag({
    type: "WIDGET",
    item: {
      id: widget.id,
      index,
      type: "WIDGET",
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Setup drop target for the widget (to support inserting before/after)
  const [{ isOver: isWidgetOver }, drop] = useDrop({
    accept: "WIDGET",
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Call the move function to reorder widgets
      moveWidget(dragIndex, hoverIndex);

      // Update the index in the item being dragged
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Create ref to attach to DOM node
  const ref = useRef(null);

  // Attach both drag and drop to the DOM node
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`dashboard-widget size-${widgetSize}${
        isMinimized ? " minimized" : ""
      }${isCustomSize ? " custom-size" : ""}${isDragging ? " dragging" : ""}${
        isWidgetOver ? " widget-drop-target" : ""
      }`}
      style={{
        ...(isCustomSize
          ? {
              width: customWidth ? `${customWidth}px` : "100%",
              height: customHeight ? `${customHeight}px` : "auto",
              gridColumn: customColumnSpan
                ? `span ${Math.min(12, customColumnSpan)}`
                : undefined,
            }
          : {
              gridColumn: undefined, // Let CSS handle this for predefined sizes
              width: "100%",
            }),
        gridRow: widgetSize === "xLarge" ? "span 2" : "span 1",
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="widget-header">
        <div className="widget-header-left">
          <div className="widget-icon">{getFieldIcon(widget.id)}</div>
          <span className="widget-title">{widget.label}</span>
          {isDragging && <span className="dragging-indicator">⟳</span>}
        </div>
        <div className="widget-controls">
          {isEditMode && (
            <>
              <button
                className={`widget-button ${
                  widgetSize === "small" ? "active" : ""
                }`}
                title="Small Size"
                onClick={() => handleSizeChange(widget.id, "small")}
              >
                S
              </button>
              <button
                className={`widget-button ${
                  widgetSize === "medium" ? "active" : ""
                }`}
                title="Medium Size"
                onClick={() => handleSizeChange(widget.id, "medium")}
              >
                M
              </button>
              <button
                className={`widget-button ${
                  widgetSize === "large" ? "active" : ""
                }`}
                title="Large Size"
                onClick={() => handleSizeChange(widget.id, "large")}
              >
                L
              </button>
              <button
                className={`widget-button ${
                  widgetSize === "xLarge" ? "active" : ""
                }`}
                title="Extra Large Size"
                onClick={() => handleSizeChange(widget.id, "xLarge")}
              >
                XL
              </button>
            </>
          )}
          <button
            className="widget-button"
            title={isMinimized ? "Expand" : "Minimize"}
            onClick={() =>
              handleSizeChange(widget.id, { minimized: !isMinimized })
            }
          >
            {isMinimized ? "▼" : "▲"}
          </button>
          <button
            className="remove-btn"
            title="Remove widget"
            onClick={() => onRemove(widget.id)}
          >
            ×
          </button>
        </div>
      </div>
      <div className="widget-content-area">{renderWidgetContent(widget)}</div>
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          // Enhanced resize start logic
          const startX = e.clientX;
          const startY = e.clientY;
          const widgetElement = e.currentTarget.parentElement;
          const startWidth = widgetElement.offsetWidth;
          const startHeight = widgetElement.offsetHeight;
          const gridContainer = widgetElement.parentElement;
          const gridColumnWidth = gridContainer.offsetWidth / 12; // We have 12 columns

          const handleMouseMove = (moveEvent) => {
            const newWidth = Math.max(
              200,
              startWidth + (moveEvent.clientX - startX)
            );
            const newHeight = Math.max(
              150,
              startHeight + (moveEvent.clientY - startY)
            );

            // Calculate the closest grid column span
            const columnSpan = Math.max(
              1,
              Math.min(12, Math.round(newWidth / gridColumnWidth))
            );

            // Update the widget inline style
            widgetElement.style.width = `${newWidth}px`;
            widgetElement.style.height = `${newHeight}px`;

            // Add a data attribute for debugging
            widgetElement.dataset.gridColumns = columnSpan;
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            if (onResize) {
              // Send all dimension data to parent
              onResize(widget.id, {
                width: widgetElement.offsetWidth,
                height: widgetElement.offsetHeight,
                columnSpan: parseInt(
                  widgetElement.dataset.gridColumns || "1",
                  10
                ),
                customSize: true,
              });
            }
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
          e.preventDefault(); // Prevent text selection during resize
        }}
      ></div>
    </div>
  );
}

export default DraggableWidget;
