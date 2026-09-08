import { useRef } from "react";
import type { BodyMark } from "./types";

type BodyDiagramProps = {
  marks: BodyMark[];
  onChange?: (marks: BodyMark[]) => void;
  readOnly?: boolean;
};

function BodyDiagram({ marks, onChange, readOnly = false }: BodyDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const addMark = (event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onChange([...marks, { x, y }]);
  };

  const removeMark = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (readOnly || !onChange) return;
    onChange(marks.filter((_, i) => i !== index));
  };

  return (
    <div className="body-diagram-field">
      <div
        className={`body-diagram${readOnly ? " body-diagram--readonly" : ""}`}
        ref={containerRef}
        onClick={addMark}
      >
        <img src="./body-diagram.png" alt="体の図（前面・背面）" draggable={false} />
        {marks.map((mark, index) => (
          <span
            key={index}
            className="body-diagram-pin"
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            onClick={(event) => removeMark(index, event)}
          />
        ))}
      </div>
      {!readOnly ? (
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => onChange?.([])} disabled={!marks.length}>
            マークをクリア
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default BodyDiagram;
