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
