import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PollutionPoint, PollutionStatus, PollutionType } from "@/types/pollution";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POLLUTION_TYPE_LABELS,
  POLLUTION_TYPE_ICONS,
  POLLUTION_STATUS_LABELS,
} from "@/lib/constants";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { MapPin, User, Calendar, Clock, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface PointDetailsSheetProps {
  point: PollutionPoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: PollutionStatus) => void;
  isAdmin?: boolean;
}

export function PointDetailsSheet({
  point,
  open,
  onOpenChange,
  onStatusChange,
  isAdmin = false,
}: PointDetailsSheetProps) {
  if (!point) return null;

  // ✅ fallback-иконка, если тип не найден
  const Icon = POLLUTION_TYPE_ICONS[point.pollution_type as PollutionType] || HelpCircle;

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

  const handleStatusChange = (newStatus: PollutionStatus) => {
    onStatusChange(point.id, newStatus);
    toast.success(`Статус изменен на "${POLLUTION_STATUS_LABELS[newStatus]}"`);
  };

  // 🔹 Обеспечиваем поддержку разных названий координат (lat/lng или latitude/longitude)
  const latitude = point.latitude;
  const longitude = point.longitude;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {POLLUTION_TYPE_LABELS[point.pollution_type] || "Неизвестный тип"}
          </SheetTitle>
          <SheetDescription>
            Подробная информация о точке загрязнения
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Статус</span>
              <Badge variant={getStatusVariant(point.status)}>
                {POLLUTION_STATUS_LABELS[point.status] || "Неизвестно"}
              </Badge>
            </div>
            {isAdmin && (
              <Select
                value={point.status}
                onValueChange={(value) =>
                  handleStatusChange(value as PollutionStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {Object.entries(POLLUTION_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Описание</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {point.description || "Описание отсутствует"}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Координаты:</span>
              <span className="font-mono">
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Сообщил:</span>
              <span>{point.anonymous_name || "Аноним"}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Дата:</span>
              <span>
                {point.created_at
                  ? format(new Date(point.created_at), "d MMMM yyyy", {
                      locale: ru,
                    })
                  : "Дата не указана"}
              </span>
            </div>

            {point.updatedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Обновлено:</span>
                <span>
                  {format(new Date(point.updatedAt), "d MMMM yyyy", {
                    locale: ru,
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (latitude && longitude) {
                  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                  window.open(url, "_blank");
                } else {
                  toast.error("Координаты отсутствуют");
                }
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Открыть в Google Maps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
