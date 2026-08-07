import { shareOrDownloadImage } from "./imageExport";

export const openMailDraft = (to: string, subject: string, body: string) => {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.join("&");
  window.location.href = `mailto:${to}${query ? `?${query}` : ""}`;
};

// メールへの画像自動添付はブラウザの共有機能(Web Share API)経由でのみ可能。
// 共有メニューで「メール」を選ぶとMailアプリが画像添付済みの状態で開くが、
// 宛先の自動入力にはAPIが対応していないため、宛先は手入力が必要。
// 共有機能が使えない場合は、画像を保存したうえでmailto下書きを開く形にフォールバックする。
export const shareImageForEmail = async (
  blob: Blob,
  fileName: string,
  to: string,
  subject: string,
  body: string
): Promise<"shared" | "cancelled" | "fallback"> => {
  const file = new File([blob], fileName, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: subject, text: body });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  await shareOrDownloadImage(blob, fileName);
  openMailDraft(to, subject, body);
  return "fallback";
};
