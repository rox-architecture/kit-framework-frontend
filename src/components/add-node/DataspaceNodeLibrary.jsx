import { useMemo } from "react";
import { getAssetType } from "../../utils/nodeTypes";
import { CollapsibleSection, NodeBlock, NodeGrid } from "./LibraryPrimitives";

export default function DataspaceNodeLibrary({ title, dataspaceKey, isOpen, onToggle, catalogs, agreements, loading, error, searchText, openParticipants, onToggleParticipant, selectedItem, onSelect, emptyMessage }) {
  const agreementKeys = useMemo(() => new Set(agreements.map((a) => `${a?.providerId}::${a?.assetId}`)), [agreements]);
  const normalized = searchText.trim().toLowerCase();

  const groups = useMemo(() => catalogs.map((catalog) => {
    const participantId = catalog?.["dspace:participantId"] || "Unknown participant";
    const datasets = Array.isArray(catalog?.["dcat:dataset"]) ? catalog["dcat:dataset"] : [];
    return {
      participantId,
      catalog,
      datasets: datasets.filter((dataset) => !normalized || [dataset?.name, dataset?.title, dataset?.filename, dataset?.id, dataset?.["@id"], getAssetType(dataset)]
        .some((v) => String(v || "").toLowerCase().includes(normalized))),
    };
  }), [catalogs, normalized]);

  const hasAgreement = (dataset, participantId) => agreementKeys.has(`${participantId}::${dataset?.id || dataset?.["@id"]}`);

  return (
    <CollapsibleSection title={title} isOpen={isOpen} onToggle={onToggle}>
      {loading && <p className="anm-muted">Loading catalogs...</p>}
      {error && <p className="anm-error">Failed to load catalogs: {error}</p>}
      {!loading && !error && groups.length === 0 && <p className="anm-muted">{emptyMessage || "No catalogs available."}</p>}
      {!loading && !error && groups.map(({ participantId, catalog, datasets }) => (
        <CollapsibleSection key={catalog?.["@id"] || participantId} title={participantId} nested
          isOpen={Boolean(openParticipants[participantId])}
          onToggle={() => onToggleParticipant(participantId)}>
          {datasets.length === 0 ? <p className="anm-muted anm-indented">No matching assets.</p> : (
            <NodeGrid>
              {datasets.map((dataset) => {
                const id = dataset?.id || dataset?.["@id"] || dataset?.name;
                const selected = selectedItem?.participantId === participantId &&
                  (selectedItem?.dataset?.id || selectedItem?.dataset?.["@id"]) === (dataset?.id || dataset?.["@id"]);
                return <NodeBlock key={`${participantId}-${id}`}
                  title={dataset?.name || dataset?.title || dataset?.filename || id}
                  assetType={getAssetType(dataset)} hasAgreement={hasAgreement(dataset, participantId)} selected={selected}
                  onClick={() =>
                    onSelect(
                      catalog,
                      dataset,
                      hasAgreement(dataset, participantId),
                      dataspaceKey
                    )
                  } />;
              })}
            </NodeGrid>
          )}
        </CollapsibleSection>
      ))}
    </CollapsibleSection>
  );
}
