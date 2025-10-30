export type PollutionType = 
  | "trash"
  | "industrial"
  | "oil"
  | "plastic"
  | "chemical"
  | "other";

export type PollutionStatus = "new" | "in_progress" | "cleaned";

export interface PollutionPoint {
  id: string;
  latitude: number;
  longitude: number;
  type: PollutionType;
  status: PollutionStatus;
  description: string;
  photo?: File;
  anonymous_name: string;
  created_at: Date;
  updatedAt?: Date;
}

export interface PollutionFilter {
  types: PollutionType[];
  statuses: PollutionStatus[];
  searchQuery: string;
}
