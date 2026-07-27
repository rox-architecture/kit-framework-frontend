import { useEffect } from "react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import {
  getInputPortName,
  getOutputPortName,
  getSourceHandleId,
  getTargetHandleId,
} from "../utils/ports";

export default function CustomNode({ id, data }) {
  const inputCount = Math.max(1, Number(data.inputCount) || 1);
  const outputCount = Math.max(1, Number(data.outputCount) || 1);
  const paramOrder = data.paramOrder || Object.keys(data.params || {});
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputCount, outputCount, updateNodeInternals]);

  return (
    <div
      style={{
        width: 340,
        padding: "12px 86px",
        border: "1px solid #333",
        borderRadius: 8,
        background: "white",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
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

      <div
        style={{
          fontWeight: 700,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={data.label}
      >
        {data.label}
      </div>

      <div style={{ fontSize: 12, marginTop: 8 }}>
        {paramOrder.map((key) => {
          const parameterValue = data.params?.[key];
          const displayValue =
            parameterValue !== null && typeof parameterValue === "object"
              ? JSON.stringify(parameterValue)
              : String(parameterValue);
          const parameterText = `${key}: ${displayValue}`;

          return (
            <div
              key={key}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={parameterText}
            >
              {parameterText}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, marginTop: 8, color: "#666" }}>
        inputs: {inputCount}, outputs: {outputCount}
      </div>

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
