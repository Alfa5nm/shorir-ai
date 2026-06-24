export type LanguagePreference = "bn" | "en" | "mixed";

export type FitnessLevel = "beginner" | "returning" | "intermediate";

export type EquipmentOption = "none" | "mat" | "dumbbells" | "gym";

export interface SafetyFlags {
  hasPain: boolean;
  painAreas: string[];
  notes?: string;
}

export interface Profile {
  id: string;
  displayName?: string;
  language: LanguagePreference;
  goal: string;
  fitnessLevel: FitnessLevel;
  equipment: EquipmentOption[];
  weeklySchedule: string[];
  safety: SafetyFlags;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  displayName?: string;
  language: LanguagePreference;
  goal: string;
  fitnessLevel: FitnessLevel;
  equipment: EquipmentOption[];
  weeklySchedule: string[];
  safety: SafetyFlags;
}
