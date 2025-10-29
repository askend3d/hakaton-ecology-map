import { PollutionType, PollutionStatus } from "@/types/pollution";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { POLLUTION_TYPE_LABELS, POLLUTION_STATUS_LABELS } from "@/lib/constants";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FilterPanelProps {
  selectedTypes: PollutionType[];
  selectedStatuses: PollutionStatus[];
  searchQuery: string;
  onTypesChange: (types: PollutionType[]) => void;
  onStatusesChange: (statuses: PollutionStatus[]) => void;
  onSearchChange: (query: string) => void;
}

export function FilterPanel({
  selectedTypes,
  selectedStatuses,
  searchQuery,
  onTypesChange,
  onStatusesChange,
  onSearchChange,
}: FilterPanelProps) {
  const toggleType = (type: PollutionType) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleStatus = (status: PollutionStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Поиск</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по описанию..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Тип загрязнения</Label>
        <div className="space-y-2">
          {Object.entries(POLLUTION_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={selectedTypes.includes(type as PollutionType)}
                onCheckedChange={() => toggleType(type as PollutionType)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Статус</Label>
        <div className="space-y-2">
          {Object.entries(POLLUTION_STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={selectedStatuses.includes(status as PollutionStatus)}
                onCheckedChange={() => toggleStatus(status as PollutionStatus)}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
