import { useRef, useState } from "react";
import { captureElementImage, shareOrDownloadImage } from "./imageExport";
import ModeTabs, { type DocMode } from "./ModeTabs";
import { cancellationStorage } from "./storage";
import type { CancellationData } from "./types";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const REASONS = ["引っ越し", "効果を感じない", "費用", "時間が合わない", "他店舗を利用", "その他"];

const emptyCancellation = (): CancellationData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  submittedDate: today(),
  customerName: "",
  customerKana: "",
  memberNumber: "",
  joinDate: "",
  cancellationDate: "",
  reasons: [],
  reasonOther: "",
  signatureName: ""
});

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

type CancellationFormProps = {
  mode: DocMode;
  onModeChange: (mode: DocMode) => void;
};

function CancellationForm({ mode, onModeChange }: CancellationFormProps) {
  const [data, setData] = useState<CancellationData>(emptyCancellation);
  const [savedItems, setSavedItems] = useState<CancellationData[]>(() => cancellationStorage.getAll());
  const [status, setStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const printRef = useRef<HTMLElement>(null);

  const update = <K extends keyof CancellationData>(key: K, value: CancellationData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const onSave = () => {
    if (!data.customerName.trim()) {
      setStatus("お客様名を入力してください。");
      return;
    }
    cancellationStorage.save(data);
    setSavedItems(cancellationStorage.getAll());
    setStatus("解約届を保存しました。");
  };

  const onNew = () => {
    setData(emptyCancellation());
    setStatus("");
  };

  const onLoad = (id: string) => {
    const target = savedItems.find((item) => item.id === id);
    if (target) {
      setData(target);
      setStatus(`${target.customerName || "無題"} の解約届を読み込みました。`);
    }
  };

  const onDelete = (id: string) => {
    cancellationStorage.remove(id);
    setSavedItems(cancellationStorage.getAll());
    if (data.id === id) onNew();
  };

  const saveAsImage = async () => {
    if (!printRef.current || isSavingImage) return;
    setIsSavingImage(true);
    try {
      const blob = await captureElementImage(printRef.current);
      if (!blob) return;
      await shareOrDownloadImage(blob, `解約届_${data.customerName || "無題"}_${data.submittedDate}.png`);
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div>
          <p className="eyebrow">トレーニングジム・整体のカルテ</p>
          <h1>解約届</h1>
        </div>
        <div className="header-actions">
          <ModeTabs current={mode} onChange={onModeChange} />
          <button className="ghost-button" onClick={saveAsImage} disabled={isSavingImage}>
            {isSavingImage ? "画像を作成中" : "画像で保存"}
          </button>
        </div>
      </header>

      <main>
        <section className="panel no-print">
          <div className="section-heading">
            <span>01</span>
            <h2>基本情報</h2>
          </div>
          <div className="form-grid three">
            <label>
              届出日
              <input type="date" value={data.submittedDate} onChange={(event) => update("submittedDate", event.target.value)} />
            </label>
            <label>
              お客様名
              <input value={data.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder="例：山田 花子" />
            </label>
            <label>
              フリガナ
              <input value={data.customerKana} onChange={(event) => update("customerKana", event.target.value)} placeholder="例：ヤマダ ハナコ" />
            </label>
            <label>
              会員番号
              <input value={data.memberNumber} onChange={(event) => update("memberNumber", event.target.value)} />
            </label>
            <label>
              入会日
              <input type="date" value={data.joinDate} onChange={(event) => update("joinDate", event.target.value)} />
            </label>
            <label>
              解約希望日
              <input type="date" value={data.cancellationDate} onChange={(event) => update("cancellationDate", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>解約理由</h2>
          </div>
          <div className="checkbox-grid">
            {REASONS.map((reason) => (
              <label key={reason} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={data.reasons.includes(reason)}
                  onChange={() => update("reasons", toggleValue(data.reasons, reason))}
                />
                {reason}
              </label>
            ))}
          </div>
          <div className="form-grid">
            <label className="wide">
              その他・詳細
              <input value={data.reasonOther} onChange={(event) => update("reasonOther", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>03</span>
            <h2>署名</h2>
          </div>
          <div className="form-grid three">
            <label>
              署名（お客様氏名）
              <input value={data.signatureName} onChange={(event) => update("signatureName", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>04</span>
            <h2>保存済み解約届</h2>
          </div>
          <div className="action-row">
            <button className="primary-button" onClick={onSave}>
              保存
            </button>
            <button className="secondary-button" onClick={onNew}>
              新規作成
            </button>
          </div>
          {status ? <p className="status">{status}</p> : null}
          <div className="history-list">
            {savedItems.length ? (
              savedItems.map((item) => (
                <article key={item.id}>
                  <strong>{item.customerName || "未入力"}</strong>
                  <span>
                    {new Date(item.createdAt).toLocaleString("ja-JP")} / 届出日 {item.submittedDate}
                  </span>
                  <div className="action-row">
                    <button className="secondary-button" onClick={() => onLoad(item.id)}>
                      読み込む
                    </button>
                    <button className="ghost-button" onClick={() => onDelete(item.id)}>
                      削除
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">保存された解約届はありません。</p>
            )}
          </div>
        </section>

        <section className="report karte" aria-label="解約届" ref={printRef}>
          <div className="karte-head">
            <h2>解約届</h2>
            <div className="karte-head-meta">
              <span>届出日：{data.submittedDate || "未入力"}</span>
            </div>
          </div>

          <div className="karte-block">
            <div className="karte-row">
              <div>
                <label>氏名</label>
                <p>{data.customerName || "－"}</p>
              </div>
              <div>
                <label>フリガナ</label>
                <p>{data.customerKana || "－"}</p>
              </div>
              <div>
                <label>会員番号</label>
                <p>{data.memberNumber || "－"}</p>
              </div>
              <div>
                <label>入会日</label>
                <p>{data.joinDate || "－"}</p>
              </div>
              <div>
                <label>解約希望日</label>
                <p>{data.cancellationDate || "－"}</p>
              </div>
            </div>
          </div>

          <div className="karte-block">
            <h3>解約理由</h3>
            <div className="karte-checklist">
              {REASONS.map((reason) => (
                <span key={reason} className={data.reasons.includes(reason) ? "checked" : ""}>
                  {data.reasons.includes(reason) ? "☑" : "☐"} {reason}
                </span>
              ))}
            </div>
            <div className="karte-detail-row">
              <span>その他：{data.reasonOther || "なし"}</span>
            </div>
          </div>

          <div className="karte-block">
            <div className="karte-detail-row">
              <span>署名：{data.signatureName || "－"}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CancellationForm;
