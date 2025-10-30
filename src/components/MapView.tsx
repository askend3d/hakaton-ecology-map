import {
	MAP_CENTER,
	MAP_ZOOM,
	POLLUTION_STATUS_LABELS,
	POLLUTION_TYPE_LABELS,
} from '@/lib/constants'
import { PollutionPoint } from '@/types/pollution'
import { useEffect, useRef } from 'react'

declare global {
	interface Window {
		ymaps?: YMapsNS
	}
}

interface MapViewProps {
	points: PollutionPoint[]
	onPointSelect: (point: PollutionPoint) => void
	selectedPoint?: PollutionPoint | null
	onMapClick?: (lat: number, lng: number) => void
	pickMode?: boolean
	onCenterChange?: (lat: number, lng: number) => void
}

interface YMapEventsApi {
	add: (name: string, cb: (e: { get: (key: string) => unknown }) => void) => void
}
interface YMapGeoObjectsApi {
	add: (obj: YPlacemark) => void
	remove: (obj: YPlacemark) => void
}
interface YMapInstance {
	events: YMapEventsApi
	getCenter(): [number, number]
	setCenter(center: [number, number], zoom?: number, options?: unknown): void
	geoObjects: YMapGeoObjectsApi
	destroy(): void
}
interface YPlacemark {
	events: { add: (name: string, cb: () => void) => void }
}
interface YMapsNS {
	Map: new (
		el: HTMLElement,
		opts: { center: [number, number]; zoom: number; controls?: string[] }
	) => YMapInstance
	Placemark: new (
		coords: [number, number],
		props?: Record<string, unknown>,
		options?: Record<string, unknown>
	) => YPlacemark
	ready: (cb: () => void) => void
}

function loadYandexApi(apiKey?: string): Promise<YMapsNS> {
	if (window.ymaps) return Promise.resolve(window.ymaps!)
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.async = true
		script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${
			apiKey ? `&apikey=${apiKey}` : ''
		}`
		script.onload = () => window.ymaps?.ready(() => resolve(window.ymaps!))
		script.onerror = reject
		document.head.appendChild(script)
	})
}

export function MapView({
	points,
	onPointSelect,
	selectedPoint,
	onMapClick,
	pickMode,
	onCenterChange,
}: MapViewProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<YMapInstance | null>(null)
	const placemarksRef = useRef<YPlacemark[]>([])
	const onMapClickRef = useRef<typeof onMapClick>(onMapClick)
	const onCenterChangeRef = useRef<typeof onCenterChange>(onCenterChange)
	const pickModeRef = useRef<boolean | undefined>(pickMode)

	// Включить/выключить пользовательские SVG-иконки
	const useCustomIcons = true

	useEffect(() => {
		onMapClickRef.current = onMapClick
		onCenterChangeRef.current = onCenterChange
		pickModeRef.current = pickMode
	}, [onMapClick, onCenterChange, pickMode])

	useEffect(() => {
		let unmounted = false
		const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined
		loadYandexApi(apiKey)
			.then(ymaps => {
				if (unmounted || !containerRef.current) return
				mapRef.current = new ymaps.Map(containerRef.current, {
					center: MAP_CENTER,
					zoom: MAP_ZOOM,
					controls: ['zoomControl'],
				})

				mapRef.current.events.add('click', () => {
					if (pickModeRef.current && mapRef.current && onMapClickRef.current) {
						const center = mapRef.current.getCenter()
						onMapClickRef.current(center[0], center[1])
					}
				})

				const emitCenter = () => {
					if (!mapRef.current) return
					if (!pickModeRef.current || !onCenterChangeRef.current) return
					const c = mapRef.current.getCenter()
					onCenterChangeRef.current(c[0], c[1])
				}
				emitCenter()
				mapRef.current.events.add(
					'boundschange',
					emitCenter as unknown as (e: { get: (k: string) => unknown }) => void
				)
			})
			.catch(() => {})

		return () => {
			unmounted = true
			if (mapRef.current) {
				mapRef.current.destroy()
				mapRef.current = null
			}
		}
	}, [])

	// Метка пользователя
	useEffect(() => {
		if (!mapRef.current || !window.navigator.geolocation) return

		let userPlacemark: YPlacemark | null = null

		navigator.geolocation.getCurrentPosition(
			position => {
				const { latitude, longitude } = position.coords
				const ymaps = window.ymaps
				if (!ymaps || !mapRef.current) return

				userPlacemark = new ymaps.Placemark(
					[latitude, longitude],
					{ balloonContent: 'Вы здесь' },
					{ preset: 'islands#blueCircleDotIcon' }
				)
				mapRef.current.geoObjects.add(userPlacemark)

				if (!selectedPoint) {
					mapRef.current.setCenter([latitude, longitude], 14, { duration: 200 })
				}
			},
			err => {
				console.warn('Геолокация недоступна или пользователь запретил доступ', err)
			}
		)

		return () => {
			if (mapRef.current && userPlacemark) {
				mapRef.current.geoObjects.remove(userPlacemark)
			}
		}
	}, [mapRef.current, selectedPoint])

	// Отображение точек загрязнения
	useEffect(() => {
		const ymaps = window.ymaps
		if (!mapRef.current || !ymaps) return

		placemarksRef.current.forEach(p => mapRef.current!.geoObjects.remove(p))
		placemarksRef.current = []

		const colorByStatus: Record<string, string> = {
			new: '#ef4444',
			in_progress: '#f59e0b',
			cleaned: '#22c55e',
		}

		points.forEach(point => {
			const color = colorByStatus[point.status] || '#3b82f6'

			const svgIcon = `
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
					<circle cx="16" cy="16" r="10" fill="${color}" stroke="white" stroke-width="3"/>
					<circle cx="16" cy="16" r="4" fill="white"/>
				</svg>
			`

			const balloonHtml = `
				<div style="min-width:200px">
					<div style="font-weight:600;margin-bottom:8px">
						${POLLUTION_TYPE_LABELS[point.type]}
					</div>
					<div style="display:inline-block;padding:2px 8px;border-radius:4px;margin-bottom:8px;background:${color}22;color:${color}">
						${POLLUTION_STATUS_LABELS[point.status]}
					</div>
					<p style="color:#6b7280;margin-top:8px;font-size:12px">
						${point.description}
					</p>
				</div>
			`

			const pm = new ymaps.Placemark(
				[point.lat, point.lng],
				{ balloonContent: balloonHtml },
				useCustomIcons
					? {
							iconLayout: 'default#image',
							iconImageHref: 'data:image/svg+xml;base64,' + btoa(svgIcon),
							iconImageSize: [32, 32],
							iconImageOffset: [-16, -16],
					  }
					: { preset: 'islands#redDotIcon' }
			)

			pm.events.add('click', () => onPointSelect(point))
			mapRef.current.geoObjects.add(pm)
			placemarksRef.current.push(pm)
		})
	}, [points, onPointSelect])

	// Центрирование на выбранной точке
	useEffect(() => {
		if (!mapRef.current || !selectedPoint) return
		mapRef.current.setCenter([selectedPoint.lat, selectedPoint.lng], 15, { duration: 200 })
	}, [selectedPoint])

	return (
		<div className="relative h-full w-full rounded-lg border overflow-hidden">
			<div ref={containerRef} className="absolute inset-0 h-full w-full" />

			{pickMode && (
				<div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-40 flex flex-col items-center">
					<div className="relative">
						<div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-bounce" />
						<div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full opacity-70" />
					</div>
				</div>
			)}
		</div>
	)
}
