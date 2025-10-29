import { PollutionType, PollutionStatus } from "@/types/pollution";
import { Trash2, Factory, Droplet, Recycle, Beaker, AlertCircle } from "lucide-react";

export const POLLUTION_TYPE_LABELS: Record<PollutionType, string> = {
  household_waste: "Бытовой мусор",
  industrial_waste: "Промышленные отходы",
  oil_spill: "Нефтяное пятно",
  plastic: "Пластик",
  chemical: "Химикаты",
  other: "Другое",
};

export const POLLUTION_TYPE_ICONS: Record<PollutionType, any> = {
  household_waste: Trash2,
  industrial_waste: Factory,
  oil_spill: Droplet,
  plastic: Recycle,
  chemical: Beaker,
  other: AlertCircle,
};

export const POLLUTION_STATUS_LABELS: Record<PollutionStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  cleaned: "Очищено",
};

export const POLLUTION_STATUS_COLORS: Record<PollutionStatus, string> = {
  new: "destructive",
  in_progress: "warning",
  cleaned: "success",
};

// Координаты центра Каспийского моря для карты
export const MAP_CENTER: [number, number] = [43.656, 51.169]; // Актау, Казахстан
export const MAP_ZOOM = 12;
