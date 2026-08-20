import { useEffect, useState } from "react";
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

  const [isEditingMachineTag, setIsEditingMachineTag] =
    useState(false);

  const [machineTagDraft, setMachineTagDraft] =
    useState(data.machineTag || "");

  const saveMachineTag = () => {
    const nextMachineTag = machineTagDraft.trim();

    data.onUpdateMachineTag?.(
      id,
      nextMachineTag
    );

    setIsEditingMachineTag(false);
  };

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

      {/* Machine tag + node action buttons below the node */}
      <div
        className="nodrag nopan"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "calc(100% + 6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          zIndex: 5,
        }}
      >
        {/* Machine tag */}
        {isEditingMachineTag ? (
          <input
            autoFocus
            type="text"
            value={machineTagDraft}
            placeholder="machine"
            title="Machine tag"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={(event) => {
              setMachineTagDraft(
                event.target.value
              );
            }}
            onBlur={saveMachineTag}
            onKeyDown={(event) => {
              event.stopPropagation();

              if (event.key === "Enter") {
                event.currentTarget.blur();
              }

              if (event.key === "Escape") {
                setMachineTagDraft(
                  data.machineTag || ""
                );
                setIsEditingMachineTag(false);
              }
            }}
            style={{
              width: 96,
              height: 24,
              boxSizing: "border-box",
              padding: "0 8px",
              border: "1px solid #999",
              borderRadius: 12,
              background: "white",
              color: "#333",
              fontSize: 11,
              outline: "none",
            }}
          />
        ) : (
          <button
            type="button"
            title={
              data.machineTag
                ? `Machine: ${data.machineTag}`
                : "Set machine tag"
            }
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();

              setMachineTagDraft(
                data.machineTag || ""
              );

              setIsEditingMachineTag(true);
            }}
            style={{
              maxWidth: 105,
              height: 24,
              padding: "0 9px",
              border: "1px solid #bbb",
              borderRadius: 12,
              background: "white",
              color: data.machineTag
                ? "#333"
                : "#777",
              fontSize: 11,
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.08)",
            }}
          >
            {data.machineTag || "+ machine"}
          </button>
        )}

        {/* Node actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
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
