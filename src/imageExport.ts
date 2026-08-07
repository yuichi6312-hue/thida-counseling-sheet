import html2canvas from "html2canvas";

export const captureElementImage = async (el: HTMLElement): Promise<Blob | null> => {
  const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
};

export const shareOrDownloadImage = async (blob: Blob, fileName: string) => {
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
};
