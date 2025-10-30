export type PollutionType = 
  | "household_waste"
  | "industrial_waste"
  | "oil_spill"
  | "plastic"
  | "chemical"
  | "other";

export type PollutionStatus = "new" | "in_progress" | "cleaned";

export interface PollutionPoint {
  id: string;
  lat: number;
  lng: number;
  type: PollutionType;
  status: PollutionStatus;
  description: string;
  photo?: File;
  reportedBy: string;
  reportedAt: Date;
  updatedAt?: Date;
}

export interface PollutionFilter {
  types: PollutionType[];
  statuses: PollutionStatus[];
  searchQuery: string;
}
