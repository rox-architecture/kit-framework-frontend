import { useMemo } from "react";
import NODE_TEMPLATES from "../../config/nodeTemplates";
import NODE_METADATA from "../../config/nodeMetadata";
import { GENERAL_SECTIONS } from "../../config/nodeLibrary";
import { getBaseNodeType } from "../../utils/nodeTypes";
import { CollapsibleSection, NodeBlock, NodeGrid } from "./LibraryPrimitives";

function getMetadata(templateKey) {
  return NODE_METADATA?.[getBaseNodeType(templateKey)] || {};
}

function getLabel(templateKey) {
  const metadata = getMetadata(templateKey);
  return metadata?.description?.name || NODE_TEMPLATES?.[templateKey]?.label || templateKey;
}

function getSearchValues(templateKey) {
  const metadata = getMetadata(templateKey);
  const description = metadata?.description || {};
  const template = NODE_TEMPLATES?.[templateKey];
  return [templateKey, template?.label, description.name, description.operational_type, description.description];
}

export default function GeneralNodeLibrary({ searchText, isOpen, onToggle, openSubsections, onToggleSubsection, selectedTemplateKey, hasCatalogSelection, onSelect }) {
  const normalized = searchText.trim().toLowerCase();
  const sections = useMemo(() => GENERAL_SECTIONS.map((section) => ({
    ...section,
    nodes: section.nodes.filter((key) =>
      NODE_TEMPLATES[key] && (!normalized || getSearchValues(key).some((v) => String(v || "").toLowerCase().includes(normalized)))
    ),
  })).filter((section) => section.nodes.length > 0), [normalized]);

  return (
    <CollapsibleSection title="General" isOpen={isOpen} onToggle={onToggle}>
      {sections.length === 0 ? <p className="anm-muted">No matching general nodes.</p> : sections.map((section) => (
        <CollapsibleSection key={section.key} title={section.title} nested
          isOpen={Boolean(openSubsections[section.key])}
          onToggle={() => onToggleSubsection(section.key)}>
          <NodeGrid>
            {section.nodes.map((templateKey) => (
              <NodeBlock key={templateKey} title={getLabel(templateKey)} general
                selected={!hasCatalogSelection && selectedTemplateKey === templateKey}
                onClick={() => onSelect(templateKey)} />
            ))}
          </NodeGrid>
        </CollapsibleSection>
      ))}
    </CollapsibleSection>
  );
}
