import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  POLLUTION_TYPE_LABELS,
  POLLUTION_TYPE_ICONS,
  POLLUTION_STATUS_LABELS,
} from "@/lib/constants";
import { PollutionPoint, PollutionStatus, PollutionType } from "@/types/pollution";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  MapPin,
  User,
  Calendar,
  Clock,
  HelpCircle,
  MessageSquare,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface Comment {
  id: string;
  text: string;
  author: string;
  photo_url?: string;
  created_at: string;
}

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);

    // 🔹 Загружаем комментарии при открытии
    useEffect(() => {
      if (open && point?.id) {
        setLoadingComments(true);
        fetch(`${import.meta.env.VITE_API_URL}/pollutions/points/${point.id}/comments/`, {
          credentials: 'include',
          headers: {
            'X-CSRFToken': Cookies.get('csrftoken') || '',
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then((data) => setComments(data))
          .catch(() => toast.error("Не удалось загрузить комментарии"))
          .finally(() => setLoadingComments(false))
      }
    }, [open, point?.id])

  if (!point) return null
  const Icon = POLLUTION_TYPE_ICONS[point.pollution_type as PollutionType] || HelpCircle
  const latitude = point.latitude
  const longitude = point.longitude
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



  // 🔹 Отправка комментария
  const handleAddComment = async () => {
    if (!newComment.trim() && !photo) {
      return toast.error("Введите текст или добавьте фото");
    }
    if (!point) return;

    setPosting(true);
    const formData = new FormData();
    formData.append("text", newComment);
    if (photo) formData.append("photo", photo);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pollutions/points/${point.id}/comments/`,
        {
          method: "POST",
          body: formData,
          credentials: "include", // 👈 важно
          headers: {
            "X-CSRFToken": Cookies.get("csrftoken") || "", // 👈 тоже важно
          },
        }
      );
      

      if (!res.ok) throw new Error();
      const created = await res.json();
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      setPhoto(null);
      toast.success("Комментарий добавлен");
    } catch {
      toast.error("Ошибка при добавлении комментария");
    } finally {
      setPosting(false);
    }
  };

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
          {/* --- Статус --- */}
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
                <SelectContent>
                  {Object.entries(POLLUTION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* --- Описание --- */}
          <div>
            <h4 className="text-sm font-medium mb-2">Описание</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {point.description || "Описание отсутствует"}
            </p>
          </div>

          {/* --- Комментарии --- */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Комментарии
            </h4>

            {loadingComments ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-2 bg-muted/30">
                    <p className="text-sm">{comment.text}</p>
                    {comment.photo_url && (
                      <img
                        src={comment.photo_url}
                        alt="Фото комментария"
                        className="mt-2 rounded-md max-h-48 object-cover"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {comment.author} ·{" "}
                      {format(new Date(comment.created_at), "d MMM yyyy", { locale: ru })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Комментариев пока нет</p>
            )}

            {/* --- Добавление комментария --- */}
            <div className="mt-4 flex flex-col gap-2">
              <Input
                placeholder="Введите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
                  <ImagePlus className="w-4 h-4" />
                  <span>Добавить фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPhoto(file);
                    }}
                  />
                </label>
                {photo && (
                  <span className="text-xs text-muted-foreground">{photo.name}</span>
                )}
              </div>

              <Button onClick={handleAddComment} disabled={posting}>
                {posting ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (latitude && longitude) {
                  window.open(
                    `https://www.google.com/maps?q=${latitude},${longitude}`,
                    "_blank"
                  );
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
