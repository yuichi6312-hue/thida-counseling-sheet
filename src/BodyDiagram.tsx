import { useRef } from "react";
import type { BodyMark } from "./types";

type BodyDiagramProps = {
  marks: BodyMark[];
  onChange?: (marks: BodyMark[]) => void;
  readOnly?: boolean;
};

type BodyPartOption = {
  label: string;
  points: { x: number; y: number }[];
};

const BODY_PART_OPTIONS: BodyPartOption[] = [
  { label: "顔", points: [{ x: 24, y: 6 }] },
  { label: "肩", points: [{ x: 68, y: 15 }, { x: 82, y: 15 }] },
  { label: "二の腕", points: [{ x: 66, y: 32 }, { x: 85, y: 32 }] },
  { label: "背中", points: [{ x: 71, y: 26 }, { x: 81, y: 26 }] },
  { label: "ヒップ", points: [{ x: 73, y: 56 }, { x: 81, y: 56 }] },
  { label: "腰回り", points: [{ x: 69, y: 42 }, { x: 83, y: 42 }] },
  { label: "ウエスト", points: [{ x: 24, y: 42 }] },
  { label: "前もも", points: [{ x: 20, y: 63 }, { x: 29, y: 63 }] },
  { label: "裏もも", points: [{ x: 71, y: 64 }, { x: 80, y: 64 }] },
  { label: "膝", points: [{ x: 70, y: 70 }, { x: 82, y: 70 }] },
  { label: "ふくらはぎ", points: [{ x: 70, y: 78 }, { x: 83, y: 78 }] },
  { label: "足首", points: [{ x: 21, y: 88 }, { x: 28, y: 88 }] }
];

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

  const isPartChecked = (option: BodyPartOption) =>
    option.points.every((point) => marks.some((mark) => mark.label === option.label && mark.x === point.x && mark.y === point.y));

  const toggleBodyPart = (option: BodyPartOption) => {
    if (readOnly || !onChange) return;
    const withoutLabel = marks.filter((mark) => mark.label !== option.label);
    if (isPartChecked(option)) {
      onChange(withoutLabel);
    } else {
      onChange([...withoutLabel, ...option.points.map((point) => ({ ...point, label: option.label }))]);
    }
  };

  const selectedLabels = readOnly
    ? BODY_PART_OPTIONS.filter((option) => option.points.some((point) => marks.some((mark) => mark.label === option.label && mark.x === point.x && mark.y === point.y))).map(
        (option) => option.label
      )
    : [];

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
        <>
          <div className="checkbox-grid">
            {BODY_PART_OPTIONS.map((option) => (
              <label key={option.label} className="checkbox-item">
                <input type="checkbox" checked={isPartChecked(option)} onChange={() => toggleBodyPart(option)} />
                {option.label}
              </label>
            ))}
          </div>
          <div className="action-row">
            <button type="button" className="ghost-button" onClick={() => onChange?.([])} disabled={!marks.length}>
              マークをクリア
            </button>
          </div>
        </>
      ) : selectedLabels.length ? (
        <div className="karte-detail-row">
          <span>選択した部位：{selectedLabels.join("、")}</span>
        </div>
      ) : null}
    </div>
  );
}

export default BodyDiagram;
