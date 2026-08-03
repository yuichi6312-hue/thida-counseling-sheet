import type { CounselingSheetData } from "./types";

const COUNSELING_KEY = "thida.counseling.v1";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getSavedCounselingSheets = () => {
  return safeParse<CounselingSheetData[]>(localStorage.getItem(COUNSELING_KEY), []);
};

export const saveCounselingSheet = (sheet: CounselingSheetData) => {
  const sheets = getSavedCounselingSheets();
  const next = [sheet, ...sheets.filter((item) => item.id !== sheet.id)].slice(0, 50);
  localStorage.setItem(COUNSELING_KEY, JSON.stringify(next));
};

export const deleteCounselingSheet = (id: string) => {
  const sheets = getSavedCounselingSheets().filter((item) => item.id !== id);
  localStorage.setItem(COUNSELING_KEY, JSON.stringify(sheets));
};
