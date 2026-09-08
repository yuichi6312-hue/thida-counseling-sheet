import { useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  label?: string;
  value: string;
  onChange: (dataUrl: string) => void;
};

function SignaturePad({ label = "署名（画面に直接指またはペンでサインしてください）", value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const knownValueRef = useRef<string>(value);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const [isFullscreen, setIsFullscreen] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;
    const ratio = window.devicePixelRatio || 1;
    const width = area.clientWidth;
    const height = area.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
    }
  };

  const drawFromDataUrl = (dataUrl: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !dataUrl) return;
    const image = new Image();
    image.onload = () => {
      const ratio = window.devicePixelRatio || 1;
      ctx.drawImage(image, 0, 0, canvas.width / ratio, canvas.height / ratio);
    };
    image.src = dataUrl;
  };

  useEffect(() => {
    setupCanvas();
    drawFromDataUrl(knownValueRef.current);
    const handleResize = () => {
      setupCanvas();
      drawFromDataUrl(knownValueRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (value === knownValueRef.current) return;
    knownValueRef.current = value;
    setHasSignature(Boolean(value));
    if (value) {
      drawFromDataUrl(value);
    } else {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const last = lastPointRef.current;
    if (!canvas || !ctx || !last) return;
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      knownValueRef.current = dataUrl;
      setHasSignature(true);
      onChange(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    knownValueRef.current = "";
    setHasSignature(false);
    onChange("");
  };

  const canvasElement = (
    <canvas
      ref={canvasRef}
      className="signature-pad"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerLeave={finishStroke}
      onPointerCancel={finishStroke}
    />
  );

  return (
    <div className="signature-field">
      <span className="signature-label">{label}</span>
      <div className="signature-pad-wrap">
        <div className="signature-canvas-area" ref={isFullscreen ? undefined : areaRef}>
          {!isFullscreen ? canvasElement : null}
          {!isFullscreen && !hasSignature ? <span className="signature-placeholder">ここにサイン</span> : null}
        </div>
      </div>
      <div className="action-row">
        <button type="button" className="secondary-button" onClick={() => setIsFullscreen(true)}>
          大きく表示して署名
        </button>
        <button type="button" className="ghost-button signature-clear" onClick={clear}>
          サインをやり直す
        </button>
      </div>

      {isFullscreen ? (
        <div className="signature-backdrop" onClick={() => setIsFullscreen(false)}>
          <div className="signature-pad-overlay" onClick={(event) => event.stopPropagation()}>
            <div className="signature-pad-overlay-header">
              <span>{label}</span>
              <div className="signature-pad-overlay-actions">
                <button type="button" className="ghost-button" onClick={clear}>
                  やり直す
                </button>
                <button type="button" className="primary-button" onClick={() => setIsFullscreen(false)}>
                  完了
                </button>
              </div>
            </div>
            <div className="signature-canvas-area signature-canvas-area--fullscreen" ref={areaRef}>
              {canvasElement}
              {!hasSignature ? <span className="signature-placeholder">ここにサイン</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SignaturePad;
