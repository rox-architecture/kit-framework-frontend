import { useEffect, useMemo, useState } from "react";
import { getArtifacts } from "../services/backendApi";

function encodeArtifactPath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function getArtifactUrl(path) {
  return `/artifacts/${encodeArtifactPath(path)}`;
}

function getParentPath(path) {
  const parts = String(path || "")
    .split("/")
    .filter(Boolean);

  parts.pop();
  return parts.join("/");
}

function getExtension(name) {
  const index = String(name || "").lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function getFileKind(name) {
  const ext = getExtension(name);

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return "image";
  }

  if (["mp4", "webm", "ogg", "mov"].includes(ext)) {
    return "video";
  }

  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return "audio";
  }

  if (ext === "pdf") {
    return "pdf";
  }

  if (ext === "json") {
    return "json";
  }

  if (ext === "csv") {
    return "csv";
  }

  if (["txt", "log", "md", "yaml", "yml", "xml", "py", "js", "jsx", "ts", "tsx"].includes(ext)) {
    return "text";
  }

  return "file";
}

function formatSize(size) {
  if (size === null || size === undefined) return "";

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function FileIcon({ item }) {
  if (item.type === "directory") return "📁";

  const kind = getFileKind(item.name);

  if (kind === "image") return "🖼️";
  if (kind === "video") return "🎬";
  if (kind === "audio") return "🎵";
  if (kind === "pdf") return "📕";
  if (kind === "json") return "🧩";
  if (kind === "csv") return "📊";
  if (kind === "text") return "📄";

  return "📦";
}

function TextPreview({ fileUrl, kind }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setContent("");

    fetch(fileUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load file (${response.status}).`);
        }

        return response.text();
      })
      .then((text) => {
        if (kind === "json") {
          try {
            setContent(JSON.stringify(JSON.parse(text), null, 2));
            return;
          } catch {
            // Fall back to raw text.
          }
        }

        setContent(text);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Failed to load file.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [fileUrl, kind]);

  if (loading) {
    return <div style={messageStyle}>Loading preview...</div>;
  }

  if (error) {
    return <div style={{ ...messageStyle, color: "#b42318" }}>{error}</div>;
  }

  return (
    <pre
      style={{
        margin: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
        padding: 14,
        background: "#111827",
        color: "#e5e7eb",
        borderRadius: 6,
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    >
      {content}
    </pre>
  );
}

function ArtifactPreview({ item }) {
  if (!item) {
    return (
      <div style={emptyPreviewStyle}>
        Select a file to preview.
      </div>
    );
  }

  const kind = getFileKind(item.name);
  const fileUrl = getArtifactUrl(item.path);

  if (kind === "image") {
    return (
      <div style={previewCenterStyle}>
        <img
          src={fileUrl}
          alt={item.name}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div style={previewCenterStyle}>
        <video
          src={fileUrl}
          controls
          style={{
            width: "100%",
            maxHeight: "100%",
            background: "#000",
          }}
        />
      </div>
    );
  }

  if (kind === "audio") {
    return (
      <div style={previewCenterStyle}>
        <audio
          src={fileUrl}
          controls
          style={{ width: "90%" }}
        />
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={fileUrl}
        title={item.name}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    );
  }

  if (["text", "json", "csv"].includes(kind)) {
    return <TextPreview fileUrl={fileUrl} kind={kind} />;
  }

  return (
    <div style={emptyPreviewStyle}>
      <div>Preview is not available for this file type.</div>

      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          marginTop: 12,
          color: "#2563eb",
        }}
      >
        Open file
      </a>
    </div>
  );
}

export default function ArtifactNavigatorModal({
  isOpen,
  onClose,
}) {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayPath = useMemo(
    () => `/artifacts${currentPath ? `/${currentPath}` : ""}`,
    [currentPath]
  );

  const loadDirectory = async (path) => {
    setLoading(true);
    setError("");
    setSelectedFile(null);

    try {
        const data = await getArtifacts(path);

        setCurrentPath(
        data.path && data.path !== "."
            ? data.path
            : ""
        );

        setItems(
        Array.isArray(data.items)
            ? data.items
            : []
        );
    } catch (loadError) {
        console.error(loadError);

        setError(
        loadError?.message ||
        "Failed to load artifacts."
        );

        setItems([]);
    } finally {
        setLoading(false);
    }   
  };

  useEffect(() => {
    if (!isOpen) return;
    loadDirectory("");
  }, [isOpen]);

  if (!isOpen) return null;

  const openItem = (item) => {
    if (item.type === "directory") {
      loadDirectory(item.path);
      return;
    }

    setSelectedFile(item);
  };

  const goBack = () => {
    if (!currentPath) return;
    loadDirectory(getParentPath(currentPath));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Artifact Navigator"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        background: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "min(1100px, calc(100vw - 40px))",
          height: "min(720px, calc(100vh - 40px))",
          background: "white",
          borderRadius: 10,
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            minHeight: 58,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              Artifacts
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#666",
              }}
            >
              {displayPath}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={iconButtonStyle}
          >
            ×
          </button>
        </header>

        <div
          style={{
            padding: "9px 12px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            disabled={!currentPath}
            style={{
              ...toolbarButtonStyle,
              opacity: currentPath ? 1 : 0.45,
              cursor: currentPath ? "pointer" : "not-allowed",
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={() => loadDirectory(currentPath)}
            style={toolbarButtonStyle}
          >
            ↻ Refresh
          </button>

          <div
            style={{
              minWidth: 0,
              marginLeft: 4,
              fontSize: 12,
              color: "#555",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayPath}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "330px minmax(0, 1fr)",
          }}
        >
          <section
            style={{
              minWidth: 0,
              overflowY: "auto",
              borderRight: "1px solid #ddd",
              background: "#fafafa",
            }}
          >
            {loading ? (
              <div style={messageStyle}>Loading...</div>
            ) : error ? (
              <div
                style={{
                  ...messageStyle,
                  color: "#b42318",
                }}
              >
                {error}
              </div>
            ) : items.length === 0 ? (
              <div style={messageStyle}>
                This directory is empty.
              </div>
            ) : (
              items.map((item) => {
                const selected =
                  selectedFile?.path === item.path;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onDoubleClick={() => openItem(item)}
                    onClick={() => {
                      if (item.type === "directory") {
                        openItem(item);
                      } else {
                        setSelectedFile(item);
                      }
                    }}
                    style={{
                      width: "100%",
                      minHeight: 48,
                      padding: "7px 10px",
                      border: "none",
                      borderBottom: "1px solid #eee",
                      background: selected
                        ? "#fff7d6"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        flex: "0 0 auto",
                        fontSize: 18,
                      }}
                    >
                      <FileIcon item={item} />
                    </span>

                    <span
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight:
                            item.type === "directory"
                              ? 600
                              : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </div>

                      {item.type === "file" && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 10,
                            color: "#888",
                          }}
                        >
                          {formatSize(item.size)}
                        </div>
                      )}
                    </span>

                    {item.type === "directory" && (
                      <span style={{ color: "#999" }}>
                        ›
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </section>

          <section
            style={{
              minWidth: 0,
              minHeight: 0,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              background: "white",
            }}
          >
            {selectedFile && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile.name}
                </div>

                <a
                  href={getArtifactUrl(selectedFile.path)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: "0 0 auto",
                    fontSize: 12,
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  Open
                </a>
              </div>
            )}

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <ArtifactPreview item={selectedFile} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const toolbarButtonStyle = {
  height: 32,
  padding: "0 10px",
  borderRadius: 5,
  border: "1px solid #ccc",
  background: "white",
  color: "#222",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const iconButtonStyle = {
  width: 34,
  height: 34,
  padding: 0,
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
  fontSize: 18,
};

const messageStyle = {
  padding: 18,
  color: "#777",
  fontSize: 12,
};

const previewCenterStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const emptyPreviewStyle = {
  ...previewCenterStyle,
  flexDirection: "column",
  color: "#888",
  fontSize: 13,
};