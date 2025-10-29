import {
	MAP_CENTER,
	MAP_ZOOM,
	POLLUTION_STATUS_LABELS,
	POLLUTION_TYPE_LABELS,
} from '@/lib/constants'
import { PollutionPoint } from '@/types/pollution'
import { useEffect, useRef } from 'react'

interface MapViewProps {
	points: PollutionPoint[]
	onPointSelect: (point: PollutionPoint) => void
	selectedPoint?: PollutionPoint | null
	onMapClick?: (lat: number, lng: number) => void
	pickMode?: boolean
	onCenterChange?: (lat: number, lng: number) => void
}

declare global {
	interface Window {
		ymaps?: YMapsNS
	}
}

interface YMapEventsApi {
	add: (
		name: string,
		cb: (e: { get: (key: string) => unknown }) => void
	) => void
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

// Убрали Leaflet-иконки (переход на Яндекс.Карты)

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

	// Держим актуальные колбэки/флаги в ref, чтобы не перевешивать события
	useEffect(() => {
		onMapClickRef.current = onMapClick
		onCenterChangeRef.current = onCenterChange
		pickModeRef.current = pickMode
	}, [onMapClick, onCenterChange, pickMode])

	// Инициализация карты и однократная регистрация обработчиков
	useEffect(() => {
		let unmounted = false
		const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as
			| string
			| undefined
		loadYandexApi(apiKey)
			.then(ymaps => {
				if (unmounted || !containerRef.current) return
				mapRef.current = new ymaps.Map(containerRef.current, {
					center: MAP_CENTER,
					zoom: MAP_ZOOM,
					controls: ['zoomControl'],
				})

				// Один раз вешаем обработчик клика по карте
        mapRef.current.events.add('click', () => {
          if (pickModeRef.current && mapRef.current && onMapClickRef.current) {
            const center = mapRef.current.getCenter()
            onMapClickRef.current(center[0], center[1])
          }
        })
        

				// Один раз вешаем обработчик изменения границ (для прицела)
				const emitCenter = () => {
					if (!mapRef.current) return
					if (!pickModeRef.current || !onCenterChangeRef.current) return
					const c = mapRef.current.getCenter()
					onCenterChangeRef.current(c[0], c[1])
				}
				// Сразу сообщаем центр, если включён pickMode
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

	// Обновление маркеров
	useEffect(() => {
		const ymaps = window.ymaps
		if (!mapRef.current || !ymaps) return

		placemarksRef.current.forEach(p => p && mapRef.current.geoObjects.remove(p))
		placemarksRef.current = []

		const statusPreset: Record<string, string> = {
			new: 'islands#redDotIcon',
			in_progress: 'islands#orangeDotIcon',
			cleaned: 'islands#greenDotIcon',
		}

		points.forEach(point => {
			const pm = new ymaps.Placemark(
				[point.lat, point.lng],
				{
					balloonContent: `
                        <div style="min-width:200px">
                          <div style="font-weight:600;margin-bottom:8px">${
														POLLUTION_TYPE_LABELS[point.type]
													}</div>
                          <div style="display:inline-block;padding:2px 8px;border-radius:4px;margin-bottom:8px;background:#fef2f2;color:#991b1b">${
														POLLUTION_STATUS_LABELS[point.status]
													}</div>
                          <p style="color:#6b7280;margin-top:8px;font-size:12px">${
														point.description
													}</p>
                        </div>
                    `,
				},
				{ preset: statusPreset[point.status] || 'islands#blueDotIcon' }
			)
			pm.events.add('click', () => onPointSelect(point))
			mapRef.current.geoObjects.add(pm)
			placemarksRef.current.push(pm)
		})
	}, [points, onPointSelect])

	// Перелёт к выбранной точке
	useEffect(() => {
		if (!mapRef.current || !selectedPoint) return
		mapRef.current.setCenter([selectedPoint.lat, selectedPoint.lng], 15, {
			duration: 200,
		})
	}, [selectedPoint])

	return (
		<div className='relative h-full w-full rounded-lg border overflow-hidden'>
			<div ref={containerRef} className='absolute inset-0 h-full w-full' />
			{/* Crosshair is always at container center */}
			{pickMode && (
				<div
					className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
					style={{ zIndex: 1000 }}
				>
					<svg width='56' height='56' viewBox='0 0 56 56' aria-hidden>
						<defs>
							<filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
								<feDropShadow
									dx='0'
									dy='0'
									stdDeviation='2'
									floodColor='#000'
									floodOpacity='0.25'
								/>
							</filter>
						</defs>
						<circle
							cx='28'
							cy='28'
							r='16'
							fill='rgba(255,255,255,0.85)'
							stroke='#111827'
							strokeWidth='2'
							filter='url(#shadow)'
						/>
						<line
							x1='28'
							y1='2'
							x2='28'
							y2='54'
							stroke='#111827'
							strokeWidth='2'
							strokeLinecap='round'
						/>
						<line
							x1='2'
							y1='28'
							x2='54'
							y2='28'
							stroke='#111827'
							strokeWidth='2'
							strokeLinecap='round'
						/>
						<circle
							cx='28'
							cy='28'
							r='4'
							fill='#ef4444'
							stroke='#ffffff'
							strokeWidth='2'
						/>
					</svg>
				</div>
			)}
		</div>
	)
}
