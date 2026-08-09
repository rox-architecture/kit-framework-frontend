import { useEffect } from "react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";

import {
  getInputPortName,
  getOutputPortName,
  getSourceHandleId,
  getTargetHandleId,
} from "../utils/ports";

import { getNodeIcon } from "../config/nodeIcons";

const actionButtonStyle = {
  width: 26,
  height: 24,
  padding: 0,
  borderRadius: 5,
  border: "1px solid #bbb",
  background: "white",
  color: "#333",
  fontSize: 13,
  lineHeight: "22px",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
};

export default function CustomNode({ id, data }) {
  const inputCount = Math.max(1, Number(data.inputCount) || 1);
  const outputCount = Math.max(1, Number(data.outputCount) || 1);
  const updateNodeInternals = useUpdateNodeInternals();

  const nodeType = data.params?.type || "";
  const nodeIcon = getNodeIcon(nodeType);

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputCount, outputCount, updateNodeInternals]);

  return (
    <div
      style={{
        width: 180,
        height: 110,
        padding: "12px 58px",
        border: "1px solid #333",
        borderRadius: 10,
        background: "white",
        boxSizing: "border-box",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Asset/node name above the node */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "calc(100% + 7px)",
          transform: "translateX(-50%)",
          width: 220,
          fontWeight: 700,
          fontSize: 12,
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#222",
          pointerEvents: "none",
        }}
        title={data.label}
      >
        {data.label}
      </div>

      {/* Input ports + names */}
      {Array.from({ length: inputCount }).map((_, index) => {
        const portName = getInputPortName(index);
        const top = `${((index + 1) / (inputCount + 1)) * 100}%`;

        return (
          <div key={`input-${portName}`}>
            <Handle
              id={getTargetHandleId(portName)}
              type="target"
              position={Position.Left}
              style={{ top }}
            />

            <span
              style={{
                position: "absolute",
                left: 10,
                top,
                transform: "translateY(-50%)",
                maxWidth: 72,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 10,
                fontWeight: 600,
                color: "#555",
                pointerEvents: "none",
              }}
              title={portName}
            >
              {portName}
            </span>
          </div>
        );
      })}

      {/* Icon */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={nodeIcon}
          alt={nodeType || "node"}
          draggable={false}
          style={{
            width: 54,
            height: 54,
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>

      {/* Small node action buttons below the node */}
      <div
        className="nodrag nopan"
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(100% + 6px)",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 5,
          zIndex: 5,
        }}
      >
        <button
          type="button"
          title="Edit node parameters"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenParameters?.(id);
          }}
          style={actionButtonStyle}
        >
          ⚙
        </button>

        <button
          type="button"
          title="Delete node"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            data.onDeleteNode?.(id);
          }}
          style={actionButtonStyle}
        >
          🗑
        </button>
      </div>

      {/* Output ports + names */}
      {Array.from({ length: outputCount }).map((_, index) => {
        const portName = getOutputPortName(index);
        const top = `${((index + 1) / (outputCount + 1)) * 100}%`;

        return (
          <div key={`output-${portName}`}>
            <Handle
              id={getSourceHandleId(portName)}
              type="source"
              position={Position.Right}
              style={{ top }}
            />

            <span
              style={{
                position: "absolute",
                right: 10,
                top,
                transform: "translateY(-50%)",
                maxWidth: 72,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "right",
                fontSize: 10,
                fontWeight: 600,
                color: "#555",
                pointerEvents: "none",
              }}
              title={portName}
            >
              {portName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
