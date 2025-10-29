import { PollutionPoint } from "@/types/pollution";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  POLLUTION_TYPE_LABELS, 
  POLLUTION_TYPE_ICONS, 
  POLLUTION_STATUS_LABELS 
} from "@/lib/constants";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, User, Calendar } from "lucide-react";

interface PollutionCardProps {
  point: PollutionPoint;
  onClick: () => void;
  isSelected?: boolean;
}

export function PollutionCard({ point, onClick, isSelected }: PollutionCardProps) {
  const Icon = POLLUTION_TYPE_ICONS[point.type];
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "in_progress":
        return "secondary";
      case "cleaned":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight">
              {POLLUTION_TYPE_LABELS[point.type]}
            </h3>
            <Badge variant={getStatusVariant(point.status)} className="shrink-0 text-xs">
              {POLLUTION_STATUS_LABELS[point.status]}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {point.description}
          </p>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{point.reportedBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(point.reportedAt), "d MMMM yyyy", { locale: ru })}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
