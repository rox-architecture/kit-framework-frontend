import { useEffect, useRef, useState } from "react";

const SERVICES = [
  { value: "api", label: "API" },
  { value: "worker-1", label: "Worker 1" },
  { value: "worker-2", label: "Worker 2" },
  { value: "worker-3", label: "Worker 3" },
  { value: "worker-4", label: "Worker 4" },
];

const API_BASE_URL = "http://localhost:8080";

export default function MonitoringModal({
  isOpen,
  onClose,
}) {
  const [selectedService, setSelectedService] =
    useState("api");

  const [logs, setLogs] = useState([]);

  const [connectionState, setConnectionState] =
    useState("connecting");

  const [position, setPosition] = useState({
    x: 120,
    y: 120,
  });

  const logContainerRef = useRef(null);
  const dragStateRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLogs([]);
    setConnectionState("connecting");

    const url =
      `${API_BASE_URL}/system/logs/` +
      `${selectedService}/stream`;

    const source = new EventSource(url);

    source.onopen = () => {
      setConnectionState("connected");
    };

    source.onmessage = (event) => {
      setLogs((currentLogs) => [
        ...currentLogs,
        event.data,
      ]);
    };

    source.onerror = () => {
      setConnectionState("unavailable");
      source.close();
    };

    return () => {
      source.close();
    };
  }, [isOpen, selectedService]);

  useEffect(() => {
    const container = logContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [logs]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const deltaX =
        event.clientX - dragState.startX;

      const deltaY =
        event.clientY - dragState.startY;

      const nextX =
        dragState.originX + deltaX;

      const nextY =
        dragState.originY + deltaY;

      setPosition({
        x: Math.max(0, nextX),
        y: Math.max(0, nextY),
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",

        left: position.x,
        top: position.y,

        width: 900,
        height: 600,

        minWidth: 500,
        minHeight: 300,

        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)",

        zIndex: 1000,

        display: "flex",
        flexDirection: "column",

        background: "white",

        border: "1px solid #bbb",
        borderRadius: 8,

        boxShadow:
          "0 12px 40px rgba(0, 0, 0, 0.25)",

        overflow: "hidden",

        resize: "both",
      }}
    >
      <div
        onMouseDown={(event) => {
          if (
            event.target.closest(
              "button, select, option"
            )
          ) {
            return;
          }

          dragStateRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: position.x,
            originY: position.y,
          };
        }}
        style={{
          minHeight: 56,
          padding: "0 18px",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          borderBottom: "1px solid #ddd",
          background: "white",

          flexShrink: 0,

          cursor: "move",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <strong>Monitoring</strong>

          <select
            value={selectedService}
            onChange={(event) =>
              setSelectedService(
                event.target.value
              )
            }
            style={{
              height: 34,
              padding: "0 10px",

              borderRadius: 5,
              border: "1px solid #bbb",

              background: "white",

              cursor: "pointer",
            }}
          >
            {SERVICES.map((service) => (
              <option
                key={service.value}
                value={service.value}
              >
                {service.label}
              </option>
            ))}
          </select>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,

              color:
                connectionState === "connected"
                  ? "#15803d"
                  : connectionState === "unavailable"
                    ? "#b91c1c"
                    : "#777",
            }}
          >
            {connectionState === "connected" &&
              "Connected"}

            {connectionState === "connecting" &&
              "Connecting..."}

            {connectionState === "unavailable" &&
              "Container unavailable"}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close monitoring"
          title="Close"
          style={{
            width: 32,
            height: 32,

            border: "none",
            borderRadius: 5,

            background: "transparent",

            cursor: "pointer",

            fontSize: 22,
            lineHeight: 1,

            color: "#555",
          }}
        >
          ×
        </button>
      </div>

      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          minHeight: 0,

          overflow: "auto",

          padding: 16,

          background: "#111827",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              color: "#9ca3af",

              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

              fontSize: 12,
            }}
          >
            {connectionState ===
            "unavailable"
              ? "No log stream available."
              : "Waiting for logs..."}
          </div>
        ) : (
          <pre
            style={{
              margin: 0,

              color: "#e5e7eb",

              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

              fontSize: 12,
              lineHeight: 1.5,

              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {logs.join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}
