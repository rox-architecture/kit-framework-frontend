import { useEffect, useRef, useState } from "react";
import "./AddNodeModal.css";
import NODE_TEMPLATES from "../config/nodeTemplates";
import { createGeneralSectionOpenState } from "../config/nodeLibrary";
import { getCatalogs, getAgreements, negotiateAsset } from "../services/backendApi";
import { ASSET_TYPES, getAssetType } from "../utils/nodeTypes";
import { buildDataspaceNodeConfig } from "../utils/dataspaceNodes";
import GeneralNodeLibrary from "./add-node/GeneralNodeLibrary";
import DataspaceNodeLibrary from "./add-node/DataspaceNodeLibrary";
import NodeMetadataPanel from "./add-node/NodeMetadataPanel";

export default function AddNodeModal({ isOpen, onClose, selectedTemplateKey, setSelectedTemplateKey, addNodeFromTemplate }) {
  const [searchText, setSearchText] = useState("");
  const [leftPaneRatio, setLeftPaneRatio] = useState(70);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalSize, setModalSize] = useState(() => ({ width: Math.min(1100, window.innerWidth * 0.95), height: Math.min(760, window.innerHeight * 0.9) }));
  const [catalogs, setCatalogs] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [isFormattedMetadata, setIsFormattedMetadata] = useState(true);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [openSections, setOpenSections] = useState({ general: true, dlr: true, tsi: true });
  const [openGeneralSections, setOpenGeneralSections] = useState(() => createGeneralSectionOpenState(true));
  const [openParticipants, setOpenParticipants] = useState({});

  const splitContainerRef = useRef(null);
  const isSplitResizingRef = useRef(false);
  const dragStateRef = useRef(null);
  const resizeStateRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchText(""); setLeftPaneRatio(70); setSelectedCatalogItem(null); setIsFormattedMetadata(true); setAgreements([]); setNegotiationMessage("");
      return;
    }
    const controller = new AbortController();
    setLoading(true); setCatalogError("");
    getCatalogs(controller.signal).then((data) => {
      setCatalogs(data);
      setOpenParticipants(Object.fromEntries(data.map((c) => [c?.["dspace:participantId"] || "Unknown participant", true])));
      return getAgreements(controller.signal).catch((error) => { if (error.name !== "AbortError") console.warn(error); return []; });
    }).then(setAgreements).catch((error) => { if (error.name !== "AbortError") { setCatalogError(error.message || "Failed to load catalogs."); setCatalogs([]); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isOpen]);

  useEffect(() => {
    const move = (event) => {
      if (isSplitResizingRef.current && splitContainerRef.current) {
        const b = splitContainerRef.current.getBoundingClientRect();
        setLeftPaneRatio(Math.min(85, Math.max(35, ((event.clientX - b.left) / b.width) * 100)));
      }
      if (dragStateRef.current) {
        const s = dragStateRef.current;
        setModalPosition({ x: s.initialX + event.clientX - s.startX, y: s.initialY + event.clientY - s.startY });
      }
      if (resizeStateRef.current) {
        const s = resizeStateRef.current;
        setModalSize({
          width: Math.min(Math.max(520, window.innerWidth - 40), Math.max(520, s.initialWidth + event.clientX - s.startX)),
          height: Math.min(Math.max(420, window.innerHeight - 40), Math.max(420, s.initialHeight + event.clientY - s.startY)),
        });
      }
    };
    const stop = () => { isSplitResizingRef.current = false; dragStateRef.current = null; resizeStateRef.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  }, []);

  if (!isOpen) return null;

  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const toggleGeneralSection = (key) => setOpenGeneralSections((s) => ({ ...s, [key]: !s[key] }));
  const toggleParticipant = (key) => setOpenParticipants((s) => ({ ...s, [key]: !s[key] }));

  const selectGeneralNode = (key) => { setSelectedCatalogItem(null); setSelectedTemplateKey(key); };
  const selectCatalogNode = (catalog, dataset, hasAgreement) => {
    const participantId = catalog?.["dspace:participantId"] || "Unknown participant";
    setSelectedCatalogItem({ category: "DLR dataspace", participantId, providerId: participantId, originator: catalog?.originator, endpointUrl: catalog?.["dcat:service"]?.["dcat:endpointURL"], assetType: getAssetType(dataset), hasAgreement, dataset });
    setNegotiationMessage("");
  };

  const handleAdd = () => {
    if (selectedCatalogItem) {
      if (!selectedCatalogItem.hasAgreement || selectedCatalogItem.assetType === ASSET_TYPES.UNKNOWN) return;
      const cfg = buildDataspaceNodeConfig(selectedCatalogItem); if (!cfg) return;
      addNodeFromTemplate(cfg.templateKey, cfg.params, cfg.label); onClose(); return;
    }
    if (!selectedTemplateKey) return;
    addNodeFromTemplate(); onClose();
  };

  const handleNegotiate = async () => {
    if (!selectedCatalogItem || selectedCatalogItem.hasAgreement) return;
    const assetId = selectedCatalogItem.dataset?.id || selectedCatalogItem.dataset?.["@id"];
    const providerId = selectedCatalogItem.providerId || selectedCatalogItem.participantId;
    if (!assetId || !providerId) { setNegotiationMessage("Negotiation could not be started because asset or provider information is missing."); return; }
    setIsNegotiating(true); setNegotiationMessage("");
    try {
      await negotiateAsset(providerId, assetId);
      setNegotiationMessage(`${assetId} with provider ${providerId} is being negotiated. This may take several seconds. Reopen the node library to see the changes.`);
    } catch (error) { setNegotiationMessage(error?.message || "Failed to start negotiation."); }
    finally { setIsNegotiating(false); }
  };

  const selectedMetadata = selectedCatalogItem || (selectedTemplateKey ? { category: "General", nodeType: selectedTemplateKey, template: NODE_TEMPLATES[selectedTemplateKey] } : null);
  const actionIsNegotiate = selectedCatalogItem && !selectedCatalogItem.hasAgreement;
  const actionDisabled = isNegotiating || (!selectedCatalogItem && !selectedTemplateKey) || (selectedCatalogItem?.hasAgreement && selectedCatalogItem.assetType === ASSET_TYPES.UNKNOWN);

  return <div role="dialog" aria-modal="true" aria-labelledby="add-node-dialog-title" onClick={onClose} className="anm-overlay">
    <div onClick={(e) => e.stopPropagation()} className="anm-modal" style={{ width: modalSize.width, height: modalSize.height, transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)` }}>
      <header className="anm-header" onPointerDown={(event) => {
        if (event.target.closest("button")) return; event.preventDefault();
        dragStateRef.current = { startX: event.clientX, startY: event.clientY, initialX: modalPosition.x, initialY: modalPosition.y };
      }}><h3 id="add-node-dialog-title">Add Node</h3><button type="button" onClick={onClose}>✕</button></header>

      <div ref={splitContainerRef} className="anm-split-container">
        <section className="anm-library-pane" style={{ width: `${leftPaneRatio}%` }}>
          <input type="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search nodes..." className="anm-search-input" />
          <div className="anm-library-scroll">
            <GeneralNodeLibrary searchText={searchText} isOpen={openSections.general} onToggle={() => toggleSection("general")} openSubsections={openGeneralSections} onToggleSubsection={toggleGeneralSection} selectedTemplateKey={selectedTemplateKey} hasCatalogSelection={Boolean(selectedCatalogItem)} onSelect={selectGeneralNode}/>
            <DataspaceNodeLibrary title="DLR dataspace" isOpen={openSections.dlr} onToggle={() => toggleSection("dlr")} catalogs={catalogs} agreements={agreements} loading={loading} error={catalogError} searchText={searchText} openParticipants={openParticipants} onToggleParticipant={toggleParticipant} selectedItem={selectedCatalogItem} onSelect={selectCatalogNode}/>
            <DataspaceNodeLibrary title="TSI dataspace" isOpen={openSections.tsi} onToggle={() => toggleSection("tsi")} catalogs={[]} agreements={[]} loading={false} error="" searchText={searchText} openParticipants={{}} onToggleParticipant={() => {}} selectedItem={null} onSelect={() => {}} emptyMessage="No TSI dataspace source is configured yet."/>
          </div>
        </section>

        <div className="anm-splitter" onPointerDown={(e) => { e.preventDefault(); isSplitResizingRef.current = true; }} />

        <section className="anm-metadata-pane" style={{ width: `${100 - leftPaneRatio}%` }}>
          <NodeMetadataPanel metadata={selectedMetadata} formatted={isFormattedMetadata} onToggleFormatted={() => setIsFormattedMetadata((v) => !v)} />
          <footer className="anm-footer">
            {negotiationMessage && <div className="anm-status">{negotiationMessage}</div>}
            <button type="button" onClick={actionIsNegotiate ? handleNegotiate : handleAdd} disabled={actionDisabled} className="anm-primary-action">
              {actionIsNegotiate ? isNegotiating ? "Negotiating..." : "Negotiate" : "Add Node"}
            </button>
          </footer>
        </section>
      </div>
      <div className="anm-resize-handle" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); resizeStateRef.current = { startX: event.clientX, startY: event.clientY, initialWidth: modalSize.width, initialHeight: modalSize.height }; }} />
    </div>
  </div>;
}
