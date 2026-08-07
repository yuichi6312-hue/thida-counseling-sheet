import type { CancellationData, ChangeRequestData, CounselingSheetData, TermsAgreementData } from "./types";

const COUNSELING_KEY = "thida.counseling.v1";
const TERMS_KEY = "thida.terms.v1";
const CANCELLATION_KEY = "thida.cancellation.v1";
const CHANGE_REQUEST_KEY = "thida.changeRequest.v1";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const makeListStorage = <T extends { id: string }>(key: string) => {
  const getAll = (): T[] => safeParse<T[]>(localStorage.getItem(key), []);
  const save = (item: T) => {
    const items = getAll();
    const next = [item, ...items.filter((entry) => entry.id !== item.id)].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(next));
  };
  const remove = (id: string) => {
    localStorage.setItem(key, JSON.stringify(getAll().filter((entry) => entry.id !== id)));
  };
  return { getAll, save, remove };
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

export const termsStorage = makeListStorage<TermsAgreementData>(TERMS_KEY);
export const cancellationStorage = makeListStorage<CancellationData>(CANCELLATION_KEY);
export const changeRequestStorage = makeListStorage<ChangeRequestData>(CHANGE_REQUEST_KEY);
