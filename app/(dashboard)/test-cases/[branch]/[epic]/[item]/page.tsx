import EvidenceUpload from "@/components/test-cases/evidence-upload";
import EvidencePreview from "@/components/test-cases/evidence-preview";

export default function EvidencePage({
  params,
}: {
  params: { item: string };
}) {
  return (
    <div className="p-6 space-y-6">
      <EvidenceUpload itemId={params.item} />
      <EvidencePreview itemId={params.item} />
    </div>
  );
}
