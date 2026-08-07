import { useRef, useState } from "react";
import { captureElementImage, shareOrDownloadImage } from "./imageExport";
import { openMailDraft } from "./mailer";
import ModeTabs, { type DocMode } from "./ModeTabs";
import SignaturePad from "./SignaturePad";
import { termsStorage } from "./storage";
import type { TermsAgreementData } from "./types";

const createId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const today = () => new Date().toISOString().slice(0, 10);

const DEFAULT_TERMS_BODY = `第１条（運営） 当店の運営・管理は東京都中央区日本橋小舟町7-1 カツラビル B1 ＴＨＩＤＡ株式会社（以下ＴＨＩＤＡまたは当店）
第２条（目的） 当店はスポーツを通じて会員の健康維持・健康増進会員相互の親睦を図るとともに、地域社会における健康で明るいコミュニティづくりに寄与することを目的とする。
第３条（会員制度） 当店は会員制とする。当店の指導を受けていただく為本規約を設ける。当店に入会しようとする者は本規約を承認し本規約に基づく諸規約をＴＨＩＤＡと相互に締結しなければならない。
次の各号のいずれかに該当する者は当店の会員になることは出来ない。
１、運動に適した健康状態にない者
２、暴力団関係者と本クラブが判断した者
３、当店が会員としてふさわしくないと判断した者
第４条（入会の手続） 当店に入会する時は所定の申込書により入会申込みを行いＴＨＩＤＡの承認を得たうえで入会金、登録料、会費、その他必録料は理由の如何を問わず返還しないものとする。
第５条（キャンセルポリシー） 当日キャンセルは予約したコースの料金のお支払い、または一回分を消化とする。
第６条（回数券について）
1、回数券の返金や他人への譲渡は不可とする。
2、有効期限は購入日より6ヶ月間とする。
第７条（月額コースについて）
1、月額コースのご契約は最低2ヶ月間のご使用より加入可能とする。
2、DAY TIMEコースの時間外利用は不可とする。
3、月額コースを解約する場合、解約したい月の前月７日までに来店して解約届けを記入提出する。（例：３月３１日までで解約したい場合、２月７日までに提出）
第８条（予約時間について） 予約時間を過ぎた場合は時間を短縮してのレッスンとする。
第９条（有効期限について）
1、指名有無に関わらず、有効期限内での使用とする。
2、月額コースは当月内での回数分の消化とする。（繰越不可）
第１０条（利用区分） 当店は別に定めるところにより、会員の年齢、性別、利用出来る時間及び施設を限定した会員の種別を設ける事が出来る。
第１１条（退会） 利用の有無にかかわらず未払いの料金のある場合は、完納しなければならない。
第１２条（規則の遵守及び責任） 会員は本規約会則、利用上の規則、注意事項を守らなければならない。当店内で（訪問トレーニング中）に発生した紛失、盗難障害その他事故について当店は一切の責任を負わないものとする。又会員は、自己の責任に帰すべき原因により、当店または第三者に損害を与えた場合は、速やかに賠償責任を果たさなければならない。但し、当店に故意又は重過失がある場合はこの限りではない。会員は紹介または同伴したビジターの責任に帰すべき原因により発生した前項の障害についても、その同伴したビジターと連帯して賠償責任を負わなければならない。この場合前項但し書きを準用する。
第１３条（未成年者の取扱） 未成年者が会員になろうとするときは、原則として本人とその親権者が連署した上申し込むものとする。この場合、親権者自ら会員となった場合同様に、本契約に基づく責任を本人と連帯して負うものとする。
第１４条（資格の譲渡、貸与の禁止） 当店の会員資格及び会員証これを他に貸与・譲渡することは出来ない。当店の会員資格を相続することは出来ない。
第１５条（利用の禁止） 次の各号に該当する者の施設利用はこれを禁止する。
１、伝染病、その他他人に伝染又は感染する恐れのある疾病を有する者
２、精神病患者
３、飲酒等により正常の施設利用が出来ないと認められた者
４、その他、医師より禁じられている者
第１６条（会員資格の一時停止・除名） 当店は会員が次の各号の１つに該当すると認めた場合は、その会員資格の一時停止又は除名を行う事が出来る。第１１条に違反したとき。当店の秩序を乱し、又は当店の名誉・品位を著しく傷つけた時。当店の施設・什器を故障または重過失により破損したとき。
第１７条（施設閉鎖・変更） 当店は、次の場合諸施設の全部又は一部を閉鎖、または休業することができる。その場合、１週間前までにその旨を告示する。異常気象、災害、事変によるとき。地方公共団体もしくは、これに類する団体の主催する行事に協力するとき（競技会等）当店が企画し、実施する諸活動を行うとき。当店が定めた日。
第１８条（事故の責任） 会員は当店活動及び施設利用に際しては、インストラクター及び施設責任者の指示ならびに当店の諸規則に従い行動するものとし、これに違反して、盗難、障害等の事故が起こっても当店及びインストラクターなどに対し一切の損害賠償を請求しないものとする。移動の際の事故：当店の設定した集合場所までの事故及び当店の設定した解散後の事故に関して当店及びインストラクターは一切の責任を負わない。各会員間での便乗を勧めることはない。オンラインレッスン及びにキックボクシングエクササイズや整体等レッスン中の事故：オンラインレッスン及びにキックボクシングエクササイズや整体等レッスン中の怪我については一切の責任を当社は負わない旨とする。
第１９条（個人情報保護法の取り扱いについて） ご入会時にご記入頂く個人情報（氏名・生年月日・血液型・電話番号等）は、緊急時の連絡、イベントのご案内、業務上のお知らせ案内、をする場合に使用するものとする。
第２０条（レンタル品の取扱いについて）（レンタル品使用管理義務、損傷、汚損、滅失等）
1、レンタル品は注意をもって管理し、通常用法に則って使用する。レンタル品がひどい損傷また、ひどい汚損したときは、原因如何を問わず、会員による費用負担により修繕または洗浄する。
2、事前書面による承諾を得ないで、レンタル品を譲渡、質入れ、転貸及び改造(分解、調整等を含む)してはならない。
3、解約より1週間以内の返却とする。
4、延滞金については、1日あたり300円とする。`;

const emptyTerms = (): TermsAgreementData => ({
  id: createId(),
  createdAt: new Date().toISOString(),
  agreementDate: today(),
  customerName: "",
  customerKana: "",
  customerEmail: "",
  termsBody: DEFAULT_TERMS_BODY,
  agreed: false,
  signatureImage: ""
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
    await shareOrDownloadImage(blob, `規約書_${data.customerName || "無題"}_${data.agreementDate}.png`);
  };

  const handleSendEmail = async () => {
    if (!data.customerEmail.trim()) {
      setStatus("送付先のメールアドレスを入力してください。");
      return;
    }
    const blob = await saveAsImage();
    if (blob) {
      await shareOrDownloadImage(blob, `規約書_${data.customerName || "無題"}_${data.agreementDate}.png`);
    }
    openMailDraft(
      data.customerEmail,
      "【THIDA】規約書のご案内",
      `${data.customerName} 様\n\n規約書をお送りいたします。\n\nTHIDA`
    );
    setStatus("画像を保存しました。開いたメール作成画面に画像を添付して送信してください。");
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
            <label>
              メールアドレス
              <input
                type="email"
                value={data.customerEmail}
                onChange={(event) => update("customerEmail", event.target.value)}
                placeholder="例：sample@example.com"
              />
            </label>
          </div>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>02</span>
            <h2>規約内容のご確認</h2>
          </div>
          <p className="entry-lead">規約書（PDF）をご確認のうえ、下記にご同意・ご署名をお願いいたします。</p>
          <div className="pdf-viewer-frame">
            <iframe src="./terms.pdf" title="規約書PDF" />
          </div>
          <a className="pdf-open-link" href="./terms.pdf" target="_blank" rel="noreferrer">
            PDFが表示されない場合はこちらで開く
          </a>
        </section>

        <section className="panel no-print">
          <div className="section-heading">
            <span>03</span>
            <h2>同意・署名</h2>
          </div>
          <label className="checkbox-item">
            <input type="checkbox" checked={data.agreed} onChange={(event) => update("agreed", event.target.checked)} />
            私は本規約を承諾し厳守いたします。
          </label>
          <SignaturePad value={data.signatureImage} onChange={(dataUrl) => update("signatureImage", dataUrl)} />
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
            <p>{data.agreed ? "☑" : "☐"} 私は本規約を承諾し厳守いたします。</p>
            <div className="signature-print">
              <span>署名</span>
              {data.signatureImage ? <img src={data.signatureImage} alt="署名" /> : <span className="muted">未署名</span>}
            </div>
          </div>

          <div className="karte-footer">
            <span>THIDA －NIHONBASHI－　東京都中央区日本橋小舟町7-1-B1　TEL 03-6231-0107</span>
            <span>THIDA －TOYOCHO－　東京都江東区東陽5-31-21　TEL 03-6666-3101</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TermsForm;
