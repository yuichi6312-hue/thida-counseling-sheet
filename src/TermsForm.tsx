import { useRef, useState } from "react";
import { captureElementImage, shareOrDownloadImage } from "./imageExport";
import ModeTabs, { type DocMode } from "./ModeTabs";
import { termsStorage } from "./storage";
import type { TermsAgreementData } from "./types";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const emptyTerms = (): TermsAgreementData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  agreementDate: today(),
  customerName: "",
  customerKana: "",
  termsBody: "",
  agreed: false,
  signatureName: ""
});

type TermsFormProps = {
  mode: DocMode;
  onModeChange: (mode: DocMode) => void;
};

function TermsForm({ mode, onModeChange }: TermsFormProps) {
  const [data, setData] = useState<TermsAgreementData>(emptyTerms);
  const [savedItems, setSavedItems] = useState<TermsAgreementData[]>(() => termsStorage.getAll());
  const [status, setStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const printRef = useRef<HTMLElement>(null);

  const update = <K extends keyof TermsAgreementData>(key: K, value: TermsAgreementData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const onSave = () => {
    if (!data.customerName.trim()) {
      setStatus("お客様名を入力してください。");
      return;
    }
    termsStorage.save(data);
    setSavedItems(termsStorage.getAll());
    setStatus("規約書を保存しました。");
  };

  const onNew = () => {
    setData(emptyTerms());
    setStatus("");
  };

  const onLoad = (id: string) => {
    const target = savedItems.find((item) => item.id === id);
    if (target) {
      setData(target);
      setStatus(`${target.customerName || "無題"} の規約書を読み込みました。`);
    }
  };

  const onDelete = (id: string) => {
    termsStorage.remove(id);
    setSavedItems(termsStorage.getAll());
    if (data.id === id) onNew();
  };

  const saveAsImage = async () => {
    if (!printRef.current || isSavingImage) return;
    setIsSavingImage(true);
    try {
      const blob = await captureElementImage(printRef.current);
      if (!blob) return;
      await shareOrDownloadImage(blob, `規約書_${data.customerName || "無題"}_${data.agreementDate}.png`);
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div>
          <p className="eyebrow">トレーニングジム・整体のカルテ</p>
          <h1>規約書</h1>
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
              契約日
              <input type="date" value={data.agreementDate} onChange={(event) => update("agreementDate", event.target.value)} />
            </label>
            <label>
              お客様名
              <input value={data.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder="例：山田 花子" />
            </label>
            <label>
              フリガナ
              <input value={data.customerKana} onChange={(event) => update("customerKana", event.target.value)} placeholder="例：ヤマダ ハナコ" />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>規約内容</h2>
          </div>
          <label>
            規約本文
            <textarea
              className="terms-body-input"
              value={data.termsBody}
              onChange={(event) => update("termsBody", event.target.value)}
              placeholder="ここに規約の本文を入力してください（後日正式な文言に差し替え予定）"
            />
          </label>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>03</span>
            <h2>同意・署名</h2>
          </div>
          <label className="checkbox-item">
            <input type="checkbox" checked={data.agreed} onChange={(event) => update("agreed", event.target.checked)} />
            上記規約の内容を確認し、同意します。
          </label>
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
            <h2>保存済み規約書</h2>
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
                    {new Date(item.createdAt).toLocaleString("ja-JP")} / 契約日 {item.agreementDate}
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
              <p className="muted">保存された規約書はありません。</p>
            )}
          </div>
        </section>

        <section className="report karte" aria-label="規約書" ref={printRef}>
          <div className="karte-head">
            <h2>規約書</h2>
            <div className="karte-head-meta">
              <span>契約日：{data.agreementDate || "未入力"}</span>
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
            </div>
          </div>

          <div className="karte-block">
            <h3>規約内容</h3>
            <p className="terms-body-print">{data.termsBody || "（規約本文は未入力です）"}</p>
          </div>

          <div className="karte-block">
            <p>{data.agreed ? "☑" : "☐"} 上記規約の内容を確認し、同意します。</p>
            <div className="karte-detail-row">
              <span>署名：{data.signatureName || "－"}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TermsForm;
