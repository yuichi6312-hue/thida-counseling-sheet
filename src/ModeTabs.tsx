export type DocMode = "counseling" | "terms" | "cancellation" | "change";

export const MODE_LABELS: Record<DocMode, string> = {
  counseling: "カウンセリングシート",
  terms: "規約書",
  cancellation: "解約届",
  change: "変更届"
};

const MODE_ORDER: DocMode[] = ["counseling", "terms", "cancellation", "change"];

function ModeTabs({ current, onChange }: { current: DocMode; onChange: (mode: DocMode) => void }) {
  return (
    <div className="mode-tabs">
      {MODE_ORDER.map((mode) => (
        <button key={mode} className={current === mode ? "active" : ""} onClick={() => onChange(mode)}>
          {MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}

export default ModeTabs;
