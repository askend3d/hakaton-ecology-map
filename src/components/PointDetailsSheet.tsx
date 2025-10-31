import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  POLLUTION_STATUS_LABELS,
  POLLUTION_TYPE_ICONS,
  POLLUTION_TYPE_LABELS,
} from '@/lib/constants'
import {
  PollutionPoint,
  PollutionStatus,
  PollutionType,
} from '@/types/pollution'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Cookies from 'js-cookie'
import { HelpCircle, ImagePlus, MapPin, MessageSquare, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Comment {
  id: string
  text: string
  author: any
  photo?: string
  created_at: string
}

interface PointDetailsSheetProps {
  point: PollutionPoint | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (id: string, status: PollutionStatus) => void
  isAdmin?: boolean
}

export function PointDetailsSheet({
  point,
  open,
  onOpenChange,
  onStatusChange,
  isAdmin = false,
}: PointDetailsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [posting, setPosting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  // ✅ Закрытие только предпросмотра по ESC, не затрагивая Sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewPhoto) {
        e.stopPropagation() // предотвращаем всплытие
        e.preventDefault()
        setPreviewPhoto(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewPhoto])

  // 🔹 Загружаем комментарии
  useEffect(() => {
    if (open && point?.id) {
      setLoadingComments(true)
      fetch(`${import.meta.env.VITE_API_URL}/pollutions/points/${point.id}/comments/`, {
        credentials: 'include',
        headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
      })
        .then(res => {
          if (!res.ok) throw new Error()
          return res.json()
        })
        .then(data => setComments(data))
        .catch(() => toast.error('Не удалось загрузить комментарии'))
        .finally(() => setLoadingComments(false))
    }
  }, [open, point?.id])

  if (!point) return null

  const Icon =
    POLLUTION_TYPE_ICONS[point.pollution_type as PollutionType] || HelpCircle
  const latitude = point.latitude
  const longitude = point.longitude

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'destructive'
      case 'in_progress':
        return 'secondary'
      case 'cleaned':
        return 'default'
      default:
        return 'outline'
    }
  }

  const handleStatusChange = async (newStatus: PollutionStatus) => {
    if (!point) return
    setStatusUpdating(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pollutions/points/${point.id}/set-status/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': Cookies.get('csrftoken') || '',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (!res.ok) throw new Error()
      toast.success(`Статус изменён на "${POLLUTION_STATUS_LABELS[newStatus]}"`)
      onStatusChange?.(point.id, newStatus)
    } catch {
      toast.error('Ошибка при смене статуса')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() && !photo) {
      return toast.error('Введите текст или добавьте фото')
    }
    if (!point) return

    setPosting(true)
    const formData = new FormData()
    formData.append('text', newComment)
    if (photo) formData.append('photo', photo)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/pollutions/points/${point.id}/comments/`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
        }
      )

      if (!res.ok) throw new Error()
      const created = await res.json()
      setComments(prev => [created, ...prev])
      setNewComment('')
      setPhoto(null)
      toast.success('Комментарий добавлен')
    } catch {
      toast.error('Ошибка при добавлении комментария')
    } finally {
      setPosting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              {POLLUTION_TYPE_LABELS[point.pollution_type] || 'Неизвестный тип'}
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
                  {POLLUTION_STATUS_LABELS[point.status] || 'Неизвестно'}
                </Badge>
              </div>
              {isAdmin && (
                <Select
                  value={point.status}
                  onValueChange={value => handleStatusChange(value as PollutionStatus)}
                >
                  <SelectTrigger disabled={statusUpdating}>
                    <SelectValue placeholder="Выберите статус" />
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

            {/* --- Фото точки --- */}
            {point.photo && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Фото загрязнения</h4>
                <img
                  src={
                    point.photo.startsWith('http')
                      ? point.photo
                      : `${import.meta.env.VITE_API_URL.replace('/api', '')}${point.photo}`
                  }
                  alt="Фото загрязнения"
                  className="rounded-xl max-h-80 object-cover border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={e => {
                    e.stopPropagation()
                    setPreviewPhoto(
                      point.photo.startsWith('http')
                        ? point.photo
                        : `${import.meta.env.VITE_API_URL.replace('/api', '')}${point.photo}`
                    )
                  }}
                />
              </div>
            )}

            {/* --- Описание --- */}
            <div>
              <h4 className="text-sm font-medium mb-2">Описание</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {point.description || 'Описание отсутствует'}
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
                  {comments.map(comment => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/60 backdrop-blur border border-gray-100 shadow-sm hover:shadow-md transition"
                    >
                      {/* --- Аватар --- */}
                      <div className="flex-shrink-0">
                        {comment.author?.photo ? (
                          <img
                            src={
                              comment.author.photo.startsWith('http')
                                ? comment.author.photo
                                : `${import.meta.env.VITE_API_URL.replace('/api', '')}${comment.author.photo}`
                            }
                            alt={comment.author.username}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-200 to-cyan-300 flex items-center justify-center text-sky-800 font-semibold text-sm">
                            {comment.author?.username
                              ? comment.author.username[0].toUpperCase()
                              : '?'}
                          </div>
                        )}
                      </div>

                      {/* --- Контент комментария --- */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-800 truncate">
                            {comment.author?.username || 'Аноним'}
                          </h5>
                          <span className="text-[11px] text-gray-400">
                            {format(new Date(comment.created_at), 'd MMM yyyy, HH:mm', {
                              locale: ru,
                            })}
                          </span>
                        </div>

                        {comment.text && (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                            {comment.text}
                          </p>
                        )}

                        {/* ✅ Фото комментария */}
                        {comment.photo && (
                          <div className="mt-2">
                            <img
                              src={
                                comment.photo.startsWith('http')
                                  ? comment.photo
                                  : `${import.meta.env.VITE_API_URL.replace('/api', '')}${comment.photo}`
                              }
                              alt="Фото комментария"
                              className="rounded-lg max-h-60 object-cover border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                              onClick={e => {
                                e.stopPropagation()
                                setPreviewPhoto(
                                  comment.photo.startsWith('http')
                                    ? comment.photo
                                    : `${import.meta.env.VITE_API_URL.replace('/api', '')}${comment.photo}`
                                )
                              }}
                            />
                          </div>
                        )}
                      </div>
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
                  onChange={e => setNewComment(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
                    <ImagePlus className="w-4 h-4" />
                    <span>Добавить фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) setPhoto(file)
                      }}
                    />
                  </label>
                  {photo && (
                    <span className="text-xs text-muted-foreground">{photo.name}</span>
                  )}
                </div>

                <Button onClick={handleAddComment} disabled={posting}>
                  {posting ? 'Отправка...' : 'Отправить'}
                </Button>
              </div>
            </div>

            {/* --- Кнопка карты --- */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (latitude && longitude) {
                    window.open(
                      `https://www.google.com/maps?q=${latitude},${longitude}`,
                      '_blank'
                    )
                  } else {
                    toast.error('Координаты отсутствуют')
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

      {/* ✅ Модалка предпросмотра фото */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
          onClick={e => {
            e.stopPropagation()
            setPreviewPhoto(null)
          }}
        >
          <button
            onClick={e => {
              e.stopPropagation()
              setPreviewPhoto(null)
            }}
            className="absolute top-5 right-5 text-white/80 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewPhoto}
            alt="Просмотр фото"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl transition-transform duration-300 scale-100 hover:scale-105"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
