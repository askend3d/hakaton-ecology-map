import { PollutionStatus, PollutionType } from '@/types/pollution'
import {
	AlertCircle,
	Beaker,
	Droplet,
	Factory,
	Recycle,
	Trash2,
} from 'lucide-react'

export const POLLUTION_TYPE_LABELS: Record<PollutionType, string> = {
	trash: 'Бытовой мусор',
	industrial: 'Промышленные отходы',
	oil: 'Нефтяное пятно',
	plastic: 'Пластик',
	chemical: 'Химикаты',
	other: 'Другое',
}

export const POLLUTION_TYPE_ICONS: Record<
	PollutionType,
	import('lucide-react').LucideIcon
> = {
	trash: Trash2,
	industrial: Factory,
	oil: Droplet,
	plastic: Recycle,
	chemical: Beaker,
	other: AlertCircle,
}

export const POLLUTION_STATUS_LABELS: Record<PollutionStatus, string> = {
	new: 'Новая',
	in_progress: 'В работе',
	cleaned: 'Очищено',
}

export const POLLUTION_STATUS_COLORS: Record<PollutionStatus, string> = {
	new: 'destructive',
	in_progress: 'warning',
	cleaned: 'success',
}

export const MAP_CENTER: [number, number] = [42.59, 47.3]
export const MAP_ZOOM = 12
