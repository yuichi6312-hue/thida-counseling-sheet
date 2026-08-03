import html2canvas from "html2canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteCounselingSheet, getSavedCounselingSheets, saveCounselingSheet } from "./storage";
import type { CounselingSheetData, Gender } from "./types";

type Stage = "entry" | "thankyou" | "staff";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const emptySheet = (): CounselingSheetData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  visitDate: today(),
  staffName: "",
  name: "",
  kana: "",
  birthdate: "",
  gender: "",
  healthConditions: [],
  healthConditionsOther: "",
  medications: "",
  allergies: "",
  exerciseFrequency: 0,
  sleepHours: 6,
  smoking: "",
  alcoholFrequency: 0,
  concerns: [],
  concernsOther: "",
  goal: "",
  priorExperience: ""
});

const HEALTH_CONDITIONS = [
  "高血圧",
  "心疾患",
  "糖尿病",
  "腰痛",
  "肩こり・首こり",
  "膝痛",
  "股関節の痛み",
  "しびれ・神経痛",
  "頭痛・めまい",
  "妊娠中",
  "手術歴あり"
];

const CONCERNS = [
  "肩こり",
  "腰痛",
  "猫背・姿勢",
  "O脚・X脚",
  "むくみ",
  "冷え性",
  "ダイエット・減量",
  "筋力アップ",
  "柔軟性向上",
  "産後の体型戻し",
  "スポーツパフォーマンス向上",
  "睡眠の質"
];

const genderLabel: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  "": "未回答"
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

const calcAge = (birthdate: string, at: string) => {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  const base = new Date(at || today());
  if (Number.isNaN(birth.getTime())) return "";
  let age = base.getFullYear() - birth.getFullYear();
  const monthDiff = base.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && base.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? String(age) : "";
};

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 101 }, (_, i) => CURRENT_YEAR - 100 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const parseBirthdate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return {
    year: y || undefined,
    month: m || undefined,
    day: d || undefined
  };
};

const formatWeeklyCount = (value: number) => (value >= 7 ? "毎日" : `週${value}回`);
const formatSleepHours = (value: number) => `${value}時間`;

type SliderFieldProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
};

function SliderField({ label, hint, value, min, max, step, formatValue, onChange }: SliderFieldProps) {
  return (
    <div className="slider-field">
      <div className="slider-field-head">
        <span>
          {label}
          {hint ? <em>{hint}</em> : null}
        </span>
        <strong>{formatValue(value)}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function App() {
  const [stage, setStage] = useState<Stage>("entry");
  const [sheet, setSheet] = useState<CounselingSheetData>(emptySheet);
  const [savedSheets, setSavedSheets] = useState<CounselingSheetData[]>(() => getSavedCounselingSheets());
  const [status, setStatus] = useState("");
  const [entryError, setEntryError] = useState("");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const karteRef = useRef<HTMLElement>(null);

  const [birthYear, setBirthYear] = useState<number | undefined>(() => parseBirthdate(sheet.birthdate).year);
  const [birthMonth, setBirthMonth] = useState<number | undefined>(() => parseBirthdate(sheet.birthdate).month);
  const [birthDay, setBirthDay] = useState<number | undefined>(() => parseBirthdate(sheet.birthdate).day);

  useEffect(() => {
    const parsed = parseBirthdate(sheet.birthdate);
    setBirthYear(parsed.year);
    setBirthMonth(parsed.month);
    setBirthDay(parsed.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.id]);

  const age = useMemo(() => calcAge(sheet.birthdate, sheet.visitDate), [sheet.birthdate, sheet.visitDate]);
  const dayOptionsForBirth = useMemo(
    () => Array.from({ length: daysInMonth(birthYear ?? CURRENT_YEAR, birthMonth ?? 1) }, (_, i) => i + 1),
    [birthYear, birthMonth]
  );

  const update = <K extends keyof CounselingSheetData>(key: K, value: CounselingSheetData[K]) => {
    setSheet((current) => ({ ...current, [key]: value }));
  };

  const updateBirthPart = (part: "year" | "month" | "day", raw: string) => {
    const value = raw === "" ? undefined : Number(raw);
    const year = part === "year" ? value : birthYear;
    const month = part === "month" ? value : birthMonth;
    const day = part === "day" ? value : birthDay;
    setBirthYear(year);
    setBirthMonth(month);
    setBirthDay(day);
    if (year && month && day) {
      const clampedDay = Math.min(day, daysInMonth(year, month));
      update("birthdate", `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`);
    } else {
      update("birthdate", "");
    }
  };

  const onSave = () => {
    if (!sheet.name.trim()) {
      setStatus("お客様名を入力してください。");
      return;
    }
    saveCounselingSheet(sheet);
    setSavedSheets(getSavedCounselingSheets());
    setStatus("カウンセリングシートを保存しました。");
  };

  const onNew = () => {
    setSheet(emptySheet());
    setStatus("");
    setEntryError("");
  };

  const onLoad = (id: string) => {
    const target = savedSheets.find((item) => item.id === id);
    if (target) {
      setSheet(target);
      setStatus(`${target.name || "無題"} のシートを読み込みました。`);
    }
  };

  const onDelete = (id: string) => {
    deleteCounselingSheet(id);
    setSavedSheets(getSavedCounselingSheets());
    if (sheet.id === id) onNew();
  };

  const finishEntry = () => {
    if (!sheet.name.trim()) {
      setEntryError("お名前を入力してください。");
      scrollTop();
      return;
    }
    setEntryError("");
    setStage("thankyou");
    scrollTop();
  };

  const goStaff = () => {
    setStage("staff");
    setStatus("");
    scrollTop();
  };

  const startNextCustomer = () => {
    onNew();
    setStage("entry");
    scrollTop();
  };

  const saveAsImage = async () => {
    if (!karteRef.current || isSavingImage) return;
    setIsSavingImage(true);
    try {
      const canvas = await html2canvas(karteRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const fileName = `カウンセリングシート_${sheet.name || "無題"}_${sheet.visitDate}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: fileName });
          return;
        } catch {
          // ユーザーがキャンセルした場合などはダウンロードにフォールバック
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsSavingImage(false);
    }
  };

  if (stage === "thankyou") {
    return (
      <div className="app">
        <main>
          <section className="panel thankyou-panel">
            <p className="eyebrow">ご入力ありがとうございました</p>
            <h1>スタッフに
              <br />
              iPadをお渡しください
            </h1>
            <p className="muted">内容を確認し、施術・トレーニングにお役立てします。</p>
            <button className="staff-link" onClick={goStaff}>
              スタッフの方はこちら
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header no-print">
        <div>
          <p className="eyebrow">トレーニングジム・整体のカルテ</p>
          <h1>カウンセリングシート</h1>
        </div>
        {stage === "staff" ? (
          <div className="header-actions">
            <button className="secondary-button" onClick={startNextCustomer}>
              次のお客様へ
            </button>
            <button className="ghost-button" onClick={saveAsImage} disabled={isSavingImage}>
              {isSavingImage ? "画像を作成中" : "画像で保存"}
            </button>
          </div>
        ) : (
          <button className="staff-link" onClick={goStaff}>
            スタッフの方はこちら
          </button>
        )}
      </header>

      <main>
        {stage === "entry" ? (
          <p className="entry-lead">
            ご来店ありがとうございます。カウンセリングのため、以下の項目のご記入をお願いいたします。
          </p>
        ) : null}

        <section className="panel no-print">
          <div className="section-heading">
            <span>01</span>
            <h2>基本情報</h2>
          </div>
          <div className="form-grid three">
            {stage === "staff" ? (
              <>
                <label>
                  来店日
                  <input type="date" value={sheet.visitDate} onChange={(event) => update("visitDate", event.target.value)} />
                </label>
                <label>
                  担当スタッフ
                  <input value={sheet.staffName} onChange={(event) => update("staffName", event.target.value)} placeholder="例：THIDA 太郎" />
                </label>
              </>
            ) : null}
            <label>
              お客様名
              <input value={sheet.name} onChange={(event) => update("name", event.target.value)} placeholder="例：山田 花子" />
            </label>
            <label>
              フリガナ
              <input value={sheet.kana} onChange={(event) => update("kana", event.target.value)} placeholder="例：ヤマダ ハナコ" />
            </label>
            <label>
              性別
              <select value={sheet.gender} onChange={(event) => update("gender", event.target.value as Gender)}>
                <option value="">未回答</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label className="wide">
              生年月日
              <div className="birthdate-select-row">
                <select value={birthYear ?? ""} onChange={(event) => updateBirthPart("year", event.target.value)}>
                  <option value="">年</option>
                  {BIRTH_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <select value={birthMonth ?? ""} onChange={(event) => updateBirthPart("month", event.target.value)}>
                  <option value="">月</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
                <select value={birthDay ?? ""} onChange={(event) => updateBirthPart("day", event.target.value)}>
                  <option value="">日</option>
                  {dayOptionsForBirth.map((d) => (
                    <option key={d} value={d}>
                      {d}日
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>既往歴・健康状態</h2>
          </div>
          <div className="checkbox-grid">
            {HEALTH_CONDITIONS.map((condition) => (
              <label key={condition} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={sheet.healthConditions.includes(condition)}
                  onChange={() => update("healthConditions", toggleValue(sheet.healthConditions, condition))}
                />
                {condition}
              </label>
            ))}
          </div>
          <div className="form-grid">
            <label className="wide">
              その他の既往歴・特記事項
              <input value={sheet.healthConditionsOther} onChange={(event) => update("healthConditionsOther", event.target.value)} />
            </label>
            <label>
              服薬中の薬
              <input value={sheet.medications} onChange={(event) => update("medications", event.target.value)} />
            </label>
            <label>
              アレルギー
              <input value={sheet.allergies} onChange={(event) => update("allergies", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>03</span>
            <h2>生活習慣</h2>
          </div>
          <div className="slider-grid">
            <SliderField
              label="運動習慣"
              hint="週の運動回数"
              value={sheet.exerciseFrequency}
              min={0}
              max={7}
              step={1}
              formatValue={formatWeeklyCount}
              onChange={(value) => update("exerciseFrequency", value)}
            />
            <SliderField
              label="睡眠時間"
              hint="平均"
              value={sheet.sleepHours}
              min={3}
              max={10}
              step={0.5}
              formatValue={formatSleepHours}
              onChange={(value) => update("sleepHours", value)}
            />
            <SliderField
              label="飲酒"
              hint="週の回数"
              value={sheet.alcoholFrequency}
              min={0}
              max={7}
              step={1}
              formatValue={formatWeeklyCount}
              onChange={(value) => update("alcoholFrequency", value)}
            />
          </div>
          <div className="form-grid">
            <label>
              喫煙
              <input value={sheet.smoking} onChange={(event) => update("smoking", event.target.value)} placeholder="例：なし／1日10本" />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>04</span>
            <h2>お悩み・ご要望</h2>
          </div>
          <div className="checkbox-grid">
            {CONCERNS.map((concern) => (
              <label key={concern} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={sheet.concerns.includes(concern)}
                  onChange={() => update("concerns", toggleValue(sheet.concerns, concern))}
                />
                {concern}
              </label>
            ))}
          </div>
          <div className="form-grid">
            <label className="wide">
              その他のお悩み
              <input value={sheet.concernsOther} onChange={(event) => update("concernsOther", event.target.value)} />
            </label>
            <label>
              目標
              <input value={sheet.goal} onChange={(event) => update("goal", event.target.value)} placeholder="例：3ヶ月で姿勢改善" />
            </label>
            <label>
              過去の施術・トレーニング経験・運動歴
              <input
                value={sheet.priorExperience}
                onChange={(event) => update("priorExperience", event.target.value)}
                placeholder="例：高校でサッカー"
              />
            </label>
          </div>
        </section>

        {stage === "entry" ? (
          <section className="panel no-print entry-submit">
            <button className="primary-button entry-submit-button" onClick={finishEntry}>
              記入を完了する
            </button>
            {entryError ? <p className="error">{entryError}</p> : null}
          </section>
        ) : null}

        {stage === "staff" ? (
          <>
            <section className="panel no-print">
              <div className="section-heading">
                <span>05</span>
                <h2>保存済みシート</h2>
              </div>
              <div className="action-row">
                <button className="primary-button" onClick={onSave}>
                  シートを保存
                </button>
                <button className="secondary-button" onClick={onNew}>
                  新規作成
                </button>
              </div>
              {status ? <p className="status">{status}</p> : null}
              <div className="history-list">
                {savedSheets.length ? (
                  savedSheets.map((item) => (
                    <article key={item.id}>
                      <strong>{item.name || "未入力"}</strong>
                      <span>
                        {new Date(item.createdAt).toLocaleString("ja-JP")} / 来店日 {item.visitDate}
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
                  <p className="muted">保存されたシートはありません。</p>
                )}
              </div>
            </section>

            <section className="report karte" aria-label="カウンセリングシート（カルテ）" ref={karteRef}>
              <div className="karte-head">
                <h2>カウンセリングシート</h2>
                <div className="karte-head-meta">
                  <span>来店日：{sheet.visitDate || "未入力"}</span>
                  <span>担当：{sheet.staffName || "未入力"}</span>
                </div>
              </div>

              <div className="karte-block">
                <div className="karte-row">
                  <div>
                    <label>氏名</label>
                    <p>{sheet.name || "－"}</p>
                  </div>
                  <div>
                    <label>フリガナ</label>
                    <p>{sheet.kana || "－"}</p>
                  </div>
                  <div>
                    <label>生年月日</label>
                    <p>
                      {sheet.birthdate || "－"}
                      {age ? `（${age}歳）` : ""}
                    </p>
                  </div>
                  <div>
                    <label>性別</label>
                    <p>{genderLabel[sheet.gender]}</p>
                  </div>
                </div>
              </div>

              <div className="karte-block">
                <h3>既往歴・健康状態</h3>
                <div className="karte-checklist">
                  {HEALTH_CONDITIONS.map((condition) => (
                    <span key={condition} className={sheet.healthConditions.includes(condition) ? "checked" : ""}>
                      {sheet.healthConditions.includes(condition) ? "☑" : "☐"} {condition}
                    </span>
                  ))}
                </div>
                <div className="karte-detail-row">
                  <span>その他：{sheet.healthConditionsOther || "なし"}</span>
                  <span>服薬：{sheet.medications || "なし"}</span>
                  <span>アレルギー：{sheet.allergies || "なし"}</span>
                </div>
              </div>

              <div className="karte-block">
                <h3>生活習慣</h3>
                <div className="karte-detail-row">
                  <span>運動習慣：{formatWeeklyCount(sheet.exerciseFrequency)}</span>
                  <span>睡眠時間：{formatSleepHours(sheet.sleepHours)}</span>
                  <span>飲酒：{formatWeeklyCount(sheet.alcoholFrequency)}</span>
                  <span>喫煙：{sheet.smoking || "なし"}</span>
                </div>
              </div>

              <div className="karte-block">
                <h3>お悩み・ご要望</h3>
                <div className="karte-checklist">
                  {CONCERNS.map((concern) => (
                    <span key={concern} className={sheet.concerns.includes(concern) ? "checked" : ""}>
                      {sheet.concerns.includes(concern) ? "☑" : "☐"} {concern}
                    </span>
                  ))}
                </div>
                <div className="karte-detail-row">
                  <span>その他：{sheet.concernsOther || "なし"}</span>
                  <span>目標：{sheet.goal || "－"}</span>
                  <span>経験：{sheet.priorExperience || "－"}</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
