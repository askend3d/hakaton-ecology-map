import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { POLLUTION_TYPE_LABELS } from '@/lib/constants'
import { PollutionType } from '@/types/pollution'
import { Camera, MapPin, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AddPointDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onAdd: (data: Omit<import('@/types/pollution').PollutionPoint, 'id'>) => void
	coords?: { lat: number; lng: number } | null
}

export function AddPointDialog({
	open,
	onOpenChange,
	onAdd,
	coords,
}: AddPointDialogProps) {
	const [formData, setFormData] = useState({
		lat: '',
		lng: '',
		type: '' as PollutionType | '',
		description: '',
		reportedBy: '',
		photo: null as File | null,
	})

	// Если пришли координаты с карты — подставляем их в форму
	useEffect(() => {
		if (!coords) return
		const nextLat = String(coords.lat)
		const nextLng = String(coords.lng)
		if (formData.lat !== nextLat || formData.lng !== nextLng) {
			setFormData(prev => ({ ...prev, lat: nextLat, lng: nextLng }))
		}
	}, [coords])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (
			!formData.lat ||
			!formData.lng ||
			!formData.type ||
			!formData.description ||
			!formData.reportedBy
		) {
			toast.error('Пожалуйста, заполните все обязательные поля')
			return
		}

		onAdd({
			lat: parseFloat(formData.lat),
			lng: parseFloat(formData.lng),
			type: formData.type,
			description: formData.description,
			reportedBy: formData.reportedBy,
			status: 'new',
			reportedAt: new Date(),
		})

		toast.success('Точка загрязнения успешно добавлена!')
		onOpenChange(false)

		// Reset form
		setFormData({
			lat: '',
			lng: '',
			type: '',
			description: '',
			reportedBy: '',
			photo: null,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Добавить точку загрязнения</DialogTitle>
					<DialogDescription>
						Заполните информацию о найденном загрязнении
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='lat'>
								<MapPin className='w-3 h-3 inline mr-1' />
								Широта *
							</Label>
							<Input
								id='lat'
								type='number'
								step='any'
								placeholder='43.656'
								value={formData.lat}
								onChange={e =>
									setFormData({ ...formData, lat: e.target.value })
								}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='lng'>
								<MapPin className='w-3 h-3 inline mr-1' />
								Долгота *
							</Label>
							<Input
								id='lng'
								type='number'
								step='any'
								placeholder='51.169'
								value={formData.lng}
								onChange={e =>
									setFormData({ ...formData, lng: e.target.value })
								}
								required
							/>
						</div>
					</div>
					<p className='text-xs text-muted-foreground -mt-2'>
						Перемещайте карту — точка ставится по центру (прицел). Координаты
						подставятся автоматически.
					</p>

					<div className='space-y-2'>
						<Label htmlFor='type'>Тип загрязнения *</Label>
						<Select
							value={formData.type}
							onValueChange={value =>
								setFormData({ ...formData, type: value as PollutionType })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Выберите тип' />
							</SelectTrigger>
							<SelectContent className='bg-popover'>
								{Object.entries(POLLUTION_TYPE_LABELS).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Описание *</Label>
						<Textarea
							id='description'
							placeholder='Опишите, что вы обнаружили...'
							value={formData.description}
							onChange={e =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={4}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='reportedBy'>
							<User className='w-3 h-3 inline mr-1' />
							Ваше имя *
						</Label>
						<Input
							id='reportedBy'
							placeholder='Имя или никнейм'
							value={formData.reportedBy}
							onChange={e =>
								setFormData({ ...formData, reportedBy: e.target.value })
							}
							required
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='photo'>
							<Camera className='w-3 h-3 inline mr-1' />
							Фото (опционально)
						</Label>
						<Input
							id='photo'
							type='file'
							accept='image/*'
							onChange={e =>
								setFormData({ ...formData, photo: e.target.files?.[0] || null })
							}
						/>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => onOpenChange(false)}
						>
							Отмена
						</Button>
						<Button type='submit'>Добавить точку</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
