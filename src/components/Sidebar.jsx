import PREDEFINED_NODE_TEMPLATES from "../templates";

export default function Sidebar({
  selectedTemplateKey, setSelectedTemplateKey, addPredefinedNode,
  exportJson, importJson, selectedEdge, selectedNode, deleteSelectedEdge,
  deleteSelectedNode, updateNodeLabel, newParamName, setNewParamName,
  newParamType, setNewParamType, newParamValue, setNewParamValue,
  addParameter, selectedParamOrder, inferParamType, editingParamKey,
  editingParamType, setEditingParamType, editingParamValue,
  setEditingParamValue, saveEditedParameter, setEditingParamKey,
  moveParameter, startEditingParameter, removeParameter, updatePortCount,
}) {
  return (
    <aside
      style={{
        width: 340,
        flex: "0 0 340px",
        alignSelf: "stretch",
        padding: 16,
        borderRight: "1px solid #ddd",
        background: "#f7f7f7",
        boxSizing: "border-box",
        overflowY: "auto",
        textAlign: "left",
      }}
    >
      <h2>Graph Editor</h2>
<div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <select
          value={selectedTemplateKey}
          onChange={(event) => setSelectedTemplateKey(event.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        >
          {Object.keys(PREDEFINED_NODE_TEMPLATES).map((templateKey) => (
            <option key={templateKey} value={templateKey}>
              {templateKey}
            </option>
          ))}
        </select>
        <button onClick={addPredefinedNode} style={{ flex: 1.3 }}>
          + Add Predefined Node
        </button>
      </div>

      <button onClick={exportJson} style={{ width: "100%" }}>
        Export JSON
      </button>

      <button
        onClick={() => document.getElementById("import-json").click()}
        style={{ width: "100%", marginTop: 8 }}
      >
        Import JSON
      </button>

      <input
        id="import-json"
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={importJson}
      />

      <hr />

      {selectedEdge ? (
        <>
          <h3>Selected Edge</h3>

          <p style={{ fontSize: 12 }}>
            {selectedEdge.source} → {selectedEdge.target}
          </p>

          <button
            onClick={deleteSelectedEdge}
            style={{ width: "100%", marginTop: 8 }}
          >
            Delete Edge
          </button>
        </>
      ) : selectedNode ? (
        <>
          <h3>Selected Node</h3>

          <button
            onClick={deleteSelectedNode}
            style={{ width: "100%", marginBottom: 12 }}
          >
            Delete Node
          </button>

          <label>
            Label
            <input
              value={selectedNode.data.label}
              onChange={(event) => updateNodeLabel(event.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                background: "white",
              }}
            />
          </label>

          {!selectedNode.data.isPredefined && (
            <>
              <h4>Add Parameter</h4>

              <input
            value={newParamName}
            onChange={(event) => setNewParamName(event.target.value)}
            placeholder="Parameter name"
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
          />

          <select
            value={newParamType}
            onChange={(event) => {
              const nextType = event.target.value;
              setNewParamType(nextType);
              setNewParamValue(nextType === "bool" ? "true" : nextType === "object" ? "{}" : "");
            }}
            style={{ width: "100%", marginBottom: 6 }}
          >
            <option value="string">string</option>
            <option value="int">int</option>
            <option value="bool">bool</option>
            <option value="object">object {}</option>
          </select>

          {newParamType === "bool" ? (
            <select
              value={newParamValue || "true"}
              onChange={(event) => setNewParamValue(event.target.value)}
              style={{ width: "100%", marginBottom: 6 }}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : newParamType === "object" ? (
            <textarea
              value={newParamValue}
              onChange={(event) => setNewParamValue(event.target.value)}
              placeholder='{"key": 1}'
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
            />
          ) : (
            <input
              type={newParamType === "int" ? "number" : "text"}
              step={newParamType === "int" ? "1" : undefined}
              value={newParamValue}
              onChange={(event) => setNewParamValue(event.target.value)}
              placeholder="Parameter value"
              style={{ width: "100%", boxSizing: "border-box", marginBottom: 6 }}
            />
          )}

              <button onClick={addParameter} style={{ width: "100%" }}>
                + Add Parameter
              </button>
            </>
          )}

          {selectedNode.data.isPredefined && (
            <p style={{ fontSize: 12, color: "#666" }}>
              Template: <strong>{selectedNode.data.templateKey}</strong>.
              The label and parameter values can be edited. Parameter names, types, ports, and locked fields are fixed.
            </p>
          )}

          <h4>Parameters</h4>

          {selectedParamOrder.length === 0 ? (
            <p>No parameters.</p>
          ) : (
            selectedParamOrder.map((key, index) => {
              const value = selectedNode.data.params?.[key];
              const type =
                selectedNode.data.paramTypes?.[key] || inferParamType(value);
              const displayValue =
                type === "object" ? JSON.stringify(value) : String(value);
              const isEditing = editingParamKey === key;
              const isLockedParam = (selectedNode.data.lockedParams || []).includes(key);

              return (
                <div
                  key={key}
                  style={{
                    background: "white",
                    padding: 8,
                    marginBottom: 6,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                >
                  {isEditing ? (
                    <>
                      <div style={{ fontSize: 12, marginBottom: 6 }}>
                        <strong>{key}</strong>
                      </div>

                      <select
                        value={editingParamType}
                        disabled={Boolean(selectedNode.data.isPredefined)}
                        onChange={(event) => {
                          const nextType = event.target.value;
                          setEditingParamType(nextType);
                          setEditingParamValue(
                            nextType === "bool"
                              ? "true"
                              : nextType === "object"
                                ? "{}"
                                : ""
                          );
                        }}
                        style={{
                          width: "100%",
                          marginBottom: 6,
                          background: selectedNode.data.isPredefined ? "#eee" : "white",
                        }}
                      >
                        <option value="string">string</option>
                        <option value="int">int</option>
                        <option value="bool">bool</option>
                        <option value="object">object {}</option>
                      </select>

                      {editingParamType === "bool" ? (
                        <select
                          value={editingParamValue}
                          onChange={(event) =>
                            setEditingParamValue(event.target.value)
                          }
                          style={{ width: "100%", marginBottom: 6 }}
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : editingParamType === "object" ? (
                        <textarea
                          value={editingParamValue}
                          onChange={(event) =>
                            setEditingParamValue(event.target.value)
                          }
                          rows={4}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            marginBottom: 6,
                          }}
                        />
                      ) : (
                        <input
                          type={editingParamType === "int" ? "number" : "text"}
                          step={editingParamType === "int" ? "1" : undefined}
                          value={editingParamValue}
                          onChange={(event) =>
                            setEditingParamValue(event.target.value)
                          }
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            marginBottom: 6,
                          }}
                        />
                      )}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={saveEditedParameter} style={{ flex: 1 }}>
                          Save
                        </button>
                        <button
                          onClick={() => setEditingParamKey(null)}
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: 6,
                        }}
                        title={`${key}: ${displayValue}`}
                      >
                        <strong>{key}</strong> ({type}): {displayValue}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {!selectedNode.data.isPredefined && (
                          <>
                            <button
                              onClick={() => moveParameter(key, "up")}
                              disabled={index === 0}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveParameter(key, "down")}
                              disabled={index === selectedParamOrder.length - 1}
                            >
                              ↓
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => startEditingParameter(key)}
                          disabled={isLockedParam}
                          title={isLockedParam ? "This parameter is fixed by the template." : undefined}
                          style={{ fontWeight: 600 }}
                        >
                          {isLockedParam ? "Fixed" : "Edit value"}
                        </button>
                        {!selectedNode.data.isPredefined && (
                          <button onClick={() => removeParameter(key)}>
                            Remove
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}

          <h4>Ports</h4>

          <label>
            Input count
            <input
              type="number"
              min="1"
              disabled={Boolean(selectedNode.data.isPredefined)}
              value={selectedNode.data.inputCount ?? 1}
              onChange={(event) =>
                updatePortCount("inputCount", event.target.value)
              }
              style={{ width: "100%", marginTop: 4, marginBottom: 8 }}
            />
          </label>

          <label>
            Output count
            <input
              type="number"
              min="1"
              disabled={Boolean(selectedNode.data.isPredefined)}
              value={selectedNode.data.outputCount ?? 1}
              onChange={(event) =>
                updatePortCount("outputCount", event.target.value)
              }
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
        </>
      ) : (
        <p>Select a node to edit parameters.</p>
      )}
    </aside>
  );
}
