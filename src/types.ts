export type Gender = "male" | "female" | "other" | "";

export type CounselingSheetData = {
  id: string;
  createdAt: string;
  visitDate: string;
  staffName: string;
  name: string;
  kana: string;
  birthdate: string;
  gender: Gender;
  healthConditions: string[];
  healthConditionsOther: string;
  medications: string;
  allergies: string;
  exerciseFrequency: number;
  sleepHours: number;
  smoking: string;
  alcoholFrequency: number;
  concerns: string[];
  concernsOther: string;
  goal: string;
  priorExperience: string;
};

export type TermsAgreementData = {
  id: string;
  createdAt: string;
  agreementDate: string;
  customerName: string;
  customerKana: string;
  termsBody: string;
  agreed: boolean;
  signatureName: string;
};

export type CancellationData = {
  id: string;
  createdAt: string;
  submittedDate: string;
  customerName: string;
  customerKana: string;
  memberNumber: string;
  joinDate: string;
  cancellationDate: string;
  reasons: string[];
  reasonOther: string;
  signatureName: string;
};

export type ChangeRequestData = {
  id: string;
  createdAt: string;
  submittedDate: string;
  customerName: string;
  customerKana: string;
  memberNumber: string;
  changeItems: string[];
  changeItemsOther: string;
  beforeDetail: string;
  afterDetail: string;
  signatureName: string;
};
