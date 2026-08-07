import { useRef, useState } from "react";
import { captureElementImage, shareOrDownloadImage } from "./imageExport";
import ModeTabs, { type DocMode } from "./ModeTabs";
import { changeRequestStorage } from "./storage";
import type { ChangeRequestData } from "./types";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const CHANGE_ITEMS = ["住所", "電話番号", "メールアドレス", "支払い方法", "コース・プラン", "その他"];

const emptyChangeRequest = (): ChangeRequestData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  submittedDate: today(),
  customerName: "",
  customerKana: "",
  memberNumber: "",
  changeItems: [],
  changeItemsOther: "",
  beforeDetail: "",
  afterDetail: "",
  signatureName: ""
});

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

type ChangeFormProps = {
  mode: DocMode;
  onModeChange: (mode: DocMode) => void;
};

function ChangeForm({ mode, onModeChange }: ChangeFormProps) {
  const [data, setData] = useState<ChangeRequestData>(emptyChangeRequest);
  const [savedItems, setSavedItems] = useState<ChangeRequestData[]>(() => changeRequestStorage.getAll());
  const [status, setStatus] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const printRef = useRef<HTMLElement>(null);

  const update = <K extends keyof ChangeRequestData>(key: K, value: ChangeRequestData[K]) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const onSave = () => {
    if (!data.customerName.trim()) {
      setStatus("お客様名を入力してください。");
      return;
    }
    changeRequestStorage.save(data);
    setSavedItems(changeRequestStorage.getAll());
    setStatus("変更届を保存しました。");
  };

  const onNew = () => {
    setData(emptyChangeRequest());
    setStatus("");
  };

  const onLoad = (id: string) => {
    const target = savedItems.find((item) => item.id === id);
    if (target) {
      setData(target);
      setStatus(`${target.customerName || "無題"} の変更届を読み込みました。`);
    }
  };

  const onDelete = (id: string) => {
    changeRequestStorage.remove(id);
    setSavedItems(changeRequestStorage.getAll());
    if (data.id === id) onNew();
  };

  const saveAsImage = async () => {
    if (!printRef.current || isSavingImage) return;
    setIsSavingImage(true);
    try {
      const blob = await captureElementImage(printRef.current);
      if (!blob) return;
      await shareOrDownloadImage(blob, `変更届_${data.customerName || "無題"}_${data.submittedDate}.png`);
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div>
          <p className="eyebrow">トレーニングジム・整体のカルテ</p>
          <h1>変更届</h1>
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
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>変更内容</h2>
          </div>
          <div className="checkbox-grid">
            {CHANGE_ITEMS.map((item) => (
              <label key={item} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={data.changeItems.includes(item)}
                  onChange={() => update("changeItems", toggleValue(data.changeItems, item))}
                />
                {item}
              </label>
            ))}
          </div>
          <div className="form-grid">
            <label className="wide">
              その他の変更項目
              <input value={data.changeItemsOther} onChange={(event) => update("changeItemsOther", event.target.value)} />
            </label>
            <label>
              変更前
              <input value={data.beforeDetail} onChange={(event) => update("beforeDetail", event.target.value)} placeholder="例：東京都〇〇区..." />
            </label>
            <label>
              変更後
              <input value={data.afterDetail} onChange={(event) => update("afterDetail", event.target.value)} placeholder="例：神奈川県〇〇市..." />
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
            <h2>保存済み変更届</h2>
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
              <p className="muted">保存された変更届はありません。</p>
            )}
          </div>
        </section>

        <section className="report karte" aria-label="変更届" ref={printRef}>
          <div className="karte-head">
            <h2>変更届</h2>
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
            </div>
          </div>

          <div className="karte-block">
            <h3>変更内容</h3>
            <div className="karte-checklist">
              {CHANGE_ITEMS.map((item) => (
                <span key={item} className={data.changeItems.includes(item) ? "checked" : ""}>
                  {data.changeItems.includes(item) ? "☑" : "☐"} {item}
                </span>
              ))}
            </div>
            <div className="karte-detail-row">
              <span>その他：{data.changeItemsOther || "なし"}</span>
              <span>変更前：{data.beforeDetail || "－"}</span>
              <span>変更後：{data.afterDetail || "－"}</span>
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

export default ChangeForm;
