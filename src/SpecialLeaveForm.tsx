import { useRef, useState } from "react";
import DateSelect from "./DateSelect";
import { captureElementImage, shareOrDownloadImage } from "./imageExport";
import { openMailDraft } from "./mailer";
import ModeTabs, { type DocMode } from "./ModeTabs";
import SignaturePad from "./SignaturePad";
import { specialLeaveStorage } from "./storage";
import type { SpecialLeaveData } from "./types";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const emptySpecialLeave = (): SpecialLeaveData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  submittedDate: today(),
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  leaveMonth: "",
  validUntilMonth: "",
  signatureImage: ""
});

type SpecialLeaveFormProps = {
  mode: DocMode;
  onModeChange: (mode: DocMode) => void;
};

function SpecialLeaveForm({ mode, onModeChange }: SpecialLeaveFormProps) {
  const [data, setData] = useState<SpecialLeaveData>(emptySpecialLeave);
  const [savedItems, setSavedItems] = useState<SpecialLeaveData[]>(() => specialLeaveStorage.getAll());
  const [status, setStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const printRef = useRef<HTMLElement>(null);

  const update = <K extends keyof SpecialLeaveData>(key: K, value: SpecialLeaveData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const onSave = () => {
    if (!data.customerName.trim()) {
      setStatus("お名前を入力してください。");
      return;
    }
    specialLeaveStorage.save(data);
    setSavedItems(specialLeaveStorage.getAll());
    setStatus("特別休会届を保存しました。");
  };

  const onNew = () => {
    setData(emptySpecialLeave());
    setStatus("");
  };

  const onLoad = (id: string) => {
    const target = savedItems.find((item) => item.id === id);
    if (target) {
      setData(target);
      setStatus(`${target.customerName || "無題"} の特別休会届を読み込みました。`);
    }
  };

  const onDelete = (id: string) => {
    specialLeaveStorage.remove(id);
    setSavedItems(specialLeaveStorage.getAll());
    if (data.id === id) onNew();
  };

  const saveAsImage = async () => {
    if (!printRef.current || isSavingImage) return null;
    setIsSavingImage(true);
    try {
      return await captureElementImage(printRef.current);
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSaveToDevice = async () => {
    const blob = await saveAsImage();
    if (!blob) return;
    await shareOrDownloadImage(blob, `特別休会届_${data.customerName || "無題"}_${data.submittedDate}.png`);
  };

  const handleSendEmail = async () => {
    if (!data.customerEmail.trim()) {
      setStatus("送付先のメールアドレスを入力してください。");
      return;
    }
    const blob = await saveAsImage();
    if (blob) {
      await shareOrDownloadImage(blob, `特別休会届_${data.customerName || "無題"}_${data.submittedDate}.png`);
    }
    openMailDraft(
      data.customerEmail,
      "【THIDA】特別休会届のご案内",
      `${data.customerName} 様\n\n特別休会届をお送りいたします。\n\nTHIDA`
    );
    setStatus("画像を保存しました。開いたメール作成画面に画像を添付して送信してください。");
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div>
          <p className="eyebrow">トレーニングジム・整体のカルテ</p>
          <h1>特別休会届</h1>
        </div>
        <div className="header-actions">
          <ModeTabs current={mode} onChange={onModeChange} />
          <button className="ghost-button" onClick={handleSaveToDevice} disabled={isSavingImage}>
            {isSavingImage ? "画像を作成中" : "iPadに保存"}
          </button>
          <button className="ghost-button" onClick={handleSendEmail} disabled={isSavingImage}>
            メールで送付
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
            <label className="wide">
              届出日
              <DateSelect value={data.submittedDate} onChange={(value) => update("submittedDate", value)} />
            </label>
            <label>
              お名前
              <input value={data.customerName} onChange={(event) => update("customerName", event.target.value)} placeholder="例：山田 花子" />
            </label>
            <label>
              電話番号
              <input value={data.customerPhone} onChange={(event) => update("customerPhone", event.target.value)} placeholder="例：090-1234-5678" />
            </label>
            <label>
              メールアドレス
              <input
                type="email"
                value={data.customerEmail}
                onChange={(event) => update("customerEmail", event.target.value)}
                placeholder="例：sample@example.com"
              />
            </label>
            <label>
              休会月（1ヶ月間）
              <select value={data.leaveMonth} onChange={(event) => update("leaveMonth", event.target.value)}>
                <option value="">月を選択</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </label>
            <label>
              有効期限（月末日まで）
              <select value={data.validUntilMonth} onChange={(event) => update("validUntilMonth", event.target.value)}>
                <option value="">月を選択</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月末日
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>ご確認事項</h2>
          </div>
          <p className="entry-lead">
            ご利用ありがとうございました。トラブル防止のため下記内容をご確認ください。
          </p>
          <p className="muted">万一上記以降に引落がされた場合は、お手数ですが店舗スタッフまでお問い合わせください。</p>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>03</span>
            <h2>署名</h2>
          </div>
          <SignaturePad value={data.signatureImage} onChange={(dataUrl) => update("signatureImage", dataUrl)} />
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>04</span>
            <h2>保存済み特別休会届</h2>
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
              <p className="muted">保存された特別休会届はありません。</p>
            )}
          </div>
        </section>

        <section className="report karte" aria-label="特別休会届" ref={printRef}>
          <div className="karte-head">
            <h2>月額特別休会届</h2>
            <div className="karte-head-meta">
              <span>届出日：{data.submittedDate || "未入力"}</span>
            </div>
          </div>

          <div className="karte-block">
            <div className="karte-row">
              <div>
                <label>お名前</label>
                <p>{data.customerName || "－"}</p>
              </div>
              <div>
                <label>電話番号</label>
                <p>{data.customerPhone || "－"}</p>
              </div>
              <div>
                <label>休会月（1ヶ月間）</label>
                <p>{data.leaveMonth ? `${data.leaveMonth}月` : "－"}</p>
              </div>
              <div>
                <label>有効期限（月末日まで）</label>
                <p>{data.validUntilMonth ? `${data.validUntilMonth}月末日` : "－"}</p>
              </div>
            </div>
          </div>

          <div className="karte-block">
            <h3>ご確認事項</h3>
            <p className="terms-body-print">
              ご利用ありがとうございました。トラブル防止のため下記内容をご確認ください。{"\n"}
              万一上記以降に引落がされた場合は、お手数ですが店舗スタッフまでお問い合わせください。
            </p>
          </div>

          <div className="karte-block">
            <div className="signature-print">
              <span>署名</span>
              {data.signatureImage ? <img src={data.signatureImage} alt="署名" /> : <span className="muted">未署名</span>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SpecialLeaveForm;
