import { useEffect, useMemo, useRef, useState } from "react";
import PREDEFINED_NODE_TEMPLATES from "../templates";

const CATALOG_URL = "http://localhost:8000/catalogs";

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  nested = false,
}) {
  return (
    <section
      style={{
        borderTop: "1px solid #d7d7d7",
        marginLeft: nested ? 10 : 0,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: nested ? "9px 8px" : "12px 4px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontWeight: nested ? 600 : 700,
        }}
      >
        <span style={{ overflowWrap: "anywhere" }}>{title}</span>
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>

      {isOpen && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </section>
  );
}

function NodeGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        alignContent: "start",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function NodeBlock({ title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 92,
        padding: 12,
        textAlign: "left",
        border: selected ? "2px solid #333" : "1px solid #ccc",
        borderRadius: 8,
        background: selected ? "#ececec" : "white",
        cursor: "pointer",
      }}
    >
      <strong
        style={{
          display: "block",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </strong>

      {subtitle && (
        <span
          style={{
            display: "block",
            marginTop: 8,
            color: "#666",
            fontSize: 12,
            overflowWrap: "anywhere",
          }}
        >
          {subtitle}
        </span>
      )}
    </button>
  );
}

export default function PredefinedNodeModal({
  isOpen,
  onClose,
  selectedTemplateKey,
  setSelectedTemplateKey,
  addPredefinedNode,
}) {
  const [searchText, setSearchText] = useState("");
  const [leftPaneRatio, setLeftPaneRatio] = useState(70);

  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState({
    width: Math.min(1100, window.innerWidth * 0.95),
    height: Math.min(760, window.innerHeight * 0.9),
  });

  const dragStateRef = useRef(null);
  const resizeStateRef = useRef(null);

  const [catalogs, setCatalogs] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);

  const [openSections, setOpenSections] = useState({
    general: true,
    dlr: true,
    tsi: true,
  });

  const [openParticipants, setOpenParticipants] = useState({});

  const splitContainerRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchText("");
      setLeftPaneRatio(70);
      setSelectedCatalogItem(null);
      return;
    }

    const abortController = new AbortController();

    const loadCatalogs = async () => {
      setIsCatalogLoading(true);
      setCatalogError("");

      try {
        const response = await fetch(CATALOG_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Catalog request failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The catalog response must be a JSON array.");
        }

        setCatalogs(data);

        const participantOpenState = {};
        data.forEach((catalog) => {
          const participantId =
            catalog?.["dspace:participantId"] || "Unknown participant";
          participantOpenState[participantId] = true;
        });
        setOpenParticipants(participantOpenState);
      } catch (error) {
        if (error.name !== "AbortError") {
          setCatalogError(error.message || "Failed to load catalogs.");
          setCatalogs([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsCatalogLoading(false);
        }
      }
    };

    loadCatalogs();

    return () => abortController.abort();
  }, [isOpen]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isResizingRef.current || !splitContainerRef.current) {
        return;
      }

      const bounds = splitContainerRef.current.getBoundingClientRect();
      const nextRatio =
        ((event.clientX - bounds.left) / bounds.width) * 100;

      setLeftPaneRatio(Math.min(85, Math.max(35, nextRatio)));
    };

    const stopResizing = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const normalizedSearchText = searchText.trim().toLowerCase();

  const filteredTemplateKeys = useMemo(() => {
    return Object.keys(PREDEFINED_NODE_TEMPLATES).filter((templateKey) =>
      templateKey.toLowerCase().includes(normalizedSearchText)
    );
  }, [normalizedSearchText]);

  const catalogGroups = useMemo(() => {
    return catalogs.map((catalog) => {
      const participantId =
        catalog?.["dspace:participantId"] || "Unknown participant";

      const datasets = Array.isArray(catalog?.["dcat:dataset"])
        ? catalog["dcat:dataset"]
        : [];

      const filteredDatasets = datasets.filter((dataset) => {
        if (!normalizedSearchText) {
          return true;
        }

        const searchableValues = [
          dataset?.name,
          dataset?.title,
          dataset?.filename,
          dataset?.description,
          dataset?.id,
          dataset?.["@id"],
          dataset?.offerType,
        ];

        return searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearchText)
        );
      });

      return {
        participantId,
        catalog,
        datasets: filteredDatasets,
      };
    });
  }, [catalogs, normalizedSearchText]);


  useEffect(() => {
    const handlePointerMove = (event) => {
      if (dragStateRef.current) {
        const { startX, startY, initialX, initialY } = dragStateRef.current;

        setModalPosition({
          x: initialX + (event.clientX - startX),
          y: initialY + (event.clientY - startY),
        });
      }

      if (resizeStateRef.current) {
        const {
          startX,
          startY,
          initialWidth,
          initialHeight,
        } = resizeStateRef.current;

        const maxWidth = Math.max(520, window.innerWidth - 40);
        const maxHeight = Math.max(420, window.innerHeight - 40);

        setModalSize({
          width: Math.min(
            maxWidth,
            Math.max(520, initialWidth + (event.clientX - startX))
          ),
          height: Math.min(
            maxHeight,
            Math.max(420, initialHeight + (event.clientY - startY))
          ),
        });
      }
    };

    const stopPointerAction = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopPointerAction);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopPointerAction);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const startDraggingModal = (event) => {
    if (event.target.closest("button")) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: modalPosition.x,
      initialY: modalPosition.y,
    };

    document.body.style.cursor = "move";
    document.body.style.userSelect = "none";
  };

  const startResizingModal = (event) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: modalSize.width,
      initialHeight: modalSize.height,
    };

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  };

  if (!isOpen) {
    return null;
  }

  const toggleSection = (sectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const toggleParticipant = (participantId) => {
    setOpenParticipants((current) => ({
      ...current,
      [participantId]: !current[participantId],
    }));
  };

  const startResizing = (event) => {
    event.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const selectGeneralNode = (templateKey) => {
    setSelectedCatalogItem(null);
    setSelectedTemplateKey(templateKey);
  };

  const selectCatalogNode = (catalog, dataset) => {
    setSelectedCatalogItem({
      participantId:
        catalog?.["dspace:participantId"] || "Unknown participant",
      originator: catalog?.originator,
      endpointUrl: catalog?.["dcat:service"]?.["dcat:endpointURL"],
      dataset,
    });
  };

  const handleAdd = () => {
    if (selectedCatalogItem || !selectedTemplateKey) {
      return;
    }

    addPredefinedNode();
    onClose();
  };

  const selectedMetadata = selectedCatalogItem
    ? selectedCatalogItem
    : selectedTemplateKey
      ? {
          source: "General",
          nodeType: selectedTemplateKey,
          template: PREDEFINED_NODE_TEMPLATES[selectedTemplateKey],
        }
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="predefined-node-dialog-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: modalSize.width,
          height: modalSize.height,
          position: "relative",
          transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 10,
          background: "white",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
        }}
      >
        <header
          onPointerDown={startDraggingModal}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "0 0 auto",
            padding: "16px 20px",
            borderBottom: "1px solid #ddd",
            cursor: "move",
            userSelect: "none",
          }}
        >
          <h3 id="predefined-node-dialog-title" style={{ margin: 0 }}>
            Add Predefined Node
          </h3>

          <button type="button" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </header>

        <div
          ref={splitContainerRef}
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <section
            style={{
              width: `${leftPaneRatio}%`,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              padding: 16,
              background: "#f7f7f7",
            }}
          >
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search nodes..."
              aria-label="Search nodes"
              style={{
                width: "100%",
                boxSizing: "border-box",
                flex: "0 0 auto",
                marginBottom: 14,
                padding: "10px 12px",
                border: "1px solid #ccc",
                borderRadius: 6,
                background: "white",
              }}
            />

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              <CollapsibleSection
                title="General"
                isOpen={openSections.general}
                onToggle={() => toggleSection("general")}
              >
                {filteredTemplateKeys.length === 0 ? (
                  <p style={{ color: "#666" }}>No matching general nodes.</p>
                ) : (
                  <NodeGrid>
                    {filteredTemplateKeys.map((templateKey) => (
                      <NodeBlock
                        key={templateKey}
                        title={templateKey}
                        selected={
                          !selectedCatalogItem &&
                          selectedTemplateKey === templateKey
                        }
                        onClick={() => selectGeneralNode(templateKey)}
                      />
                    ))}
                  </NodeGrid>
                )}
              </CollapsibleSection>

              <CollapsibleSection
                title="DLR dataspace"
                isOpen={openSections.dlr}
                onToggle={() => toggleSection("dlr")}
              >
                {isCatalogLoading && (
                  <p style={{ color: "#666" }}>Loading catalogs...</p>
                )}

                {catalogError && (
                  <p style={{ color: "#b00020" }}>
                    Failed to load catalogs: {catalogError}
                  </p>
                )}

                {!isCatalogLoading &&
                  !catalogError &&
                  catalogGroups.length === 0 && (
                    <p style={{ color: "#666" }}>No catalogs available.</p>
                  )}

                {!isCatalogLoading &&
                  !catalogError &&
                  catalogGroups.map(({ participantId, catalog, datasets }) => (
                    <CollapsibleSection
                      key={catalog?.["@id"] || participantId}
                      title={participantId}
                      nested
                      isOpen={Boolean(openParticipants[participantId])}
                      onToggle={() => toggleParticipant(participantId)}
                    >
                      {datasets.length === 0 ? (
                        <p
                          style={{
                            marginLeft: 8,
                            color: "#666",
                            fontSize: 13,
                          }}
                        >
                          No matching assets.
                        </p>
                      ) : (
                        <NodeGrid>
                          {datasets.map((dataset) => {
                            const datasetId =
                              dataset?.id ||
                              dataset?.["@id"] ||
                              dataset?.name;

                            const selected =
                              selectedCatalogItem?.participantId ===
                                participantId &&
                              (selectedCatalogItem?.dataset?.id ||
                                selectedCatalogItem?.dataset?.["@id"]) ===
                                (dataset?.id || dataset?.["@id"]);

                            return (
                              <NodeBlock
                                key={`${participantId}-${datasetId}`}
                                title={
                                  dataset?.name ||
                                  dataset?.title ||
                                  dataset?.filename ||
                                  datasetId
                                }
                                subtitle={
                                  dataset?.offerType ||
                                  dataset?.filename ||
                                  dataset?.description
                                }
                                selected={selected}
                                onClick={() =>
                                  selectCatalogNode(catalog, dataset)
                                }
                              />
                            );
                          })}
                        </NodeGrid>
                      )}
                    </CollapsibleSection>
                  ))}
              </CollapsibleSection>

              <CollapsibleSection
                title="TSI dataspace"
                isOpen={openSections.tsi}
                onToggle={() => toggleSection("tsi")}
              >
                <p style={{ color: "#666" }}>
                  No TSI dataspace source is configured yet.
                </p>
              </CollapsibleSection>
            </div>
          </section>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize modal panels"
            onPointerDown={startResizing}
            style={{
              width: 8,
              flex: "0 0 8px",
              position: "relative",
              cursor: "col-resize",
              background: "#e5e5e5",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 2,
                height: 44,
                borderRadius: 999,
                background: "#999",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <section
            style={{
              width: `${100 - leftPaneRatio}%`,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              background: "white",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                boxSizing: "border-box",
                padding: 20,
              }}
            >
              <h4 style={{ marginTop: 0 }}>Node Metadata</h4>

              {selectedMetadata ? (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(selectedMetadata, null, 2)}
                </pre>
              ) : (
                <p style={{ color: "#666" }}>
                  Select a node to view its metadata.
                </p>
              )}
            </div>

            <footer
              style={{
                flex: "0 0 auto",
                padding: 16,
                borderTop: "1px solid #ddd",
                background: "#fafafa",
              }}
            >
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedTemplateKey || Boolean(selectedCatalogItem)}
                title={
                  selectedCatalogItem
                    ? "Adding dataspace assets will be implemented next."
                    : undefined
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontWeight: 600,
                }}
              >
                Add Node
              </button>
            </footer>
          </section>
        </div>

        <div
          role="separator"
          aria-label="Resize modal"
          onPointerDown={startResizingModal}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: "nwse-resize",
            background:
              "linear-gradient(135deg, transparent 45%, #999 46%, #999 55%, transparent 56%)",
          }}
        />
      </div>
    </div>
  );
}
