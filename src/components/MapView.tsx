import {
	MAP_CENTER,
	MAP_ZOOM,
	POLLUTION_STATUS_LABELS,
	POLLUTION_TYPE_LABELS,
} from '@/lib/constants'
import { PollutionPoint } from '@/types/pollution'
import { useEffect, useRef, useState } from 'react'

declare global {
	interface Window {
		ymaps?: YMapsNS
	}
}

interface MapViewProps {
	points: PollutionPoint[]
	onPointSelect: (point: PollutionPoint) => void
	selectedPoint?: PollutionPoint | null
	onMapClick?: (latitude: number, longitude: number) => void
	pickMode?: boolean
	onCenterChange?: (latitude: number, longitude: number) => void
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
	Polygon: new (
		geometry: number[][][],
		props?: Record<string, unknown>,
		options?: Record<string, unknown>
	) => any
	ready: (cb: () => void) => void
}

const CASPIAN_BOUNDS = {
	southWest: [35.8, 46.3],
	northEast: [48.5, 55.9],
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
	const [alertVisible, setAlertVisible] = useState(false)

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
				mapRef.current.options.set('minZoom', 4)
				mapRef.current.options.set('maxZoom', 18)

				// Добавляем визуальную зону Каспия
				const caspianPolygon = new ymaps.Polygon(
					[
						[
						CASPIAN_BOUNDS.southWest,
						[CASPIAN_BOUNDS.southWest[0], CASPIAN_BOUNDS.northEast[1]],
						CASPIAN_BOUNDS.northEast,
						[CASPIAN_BOUNDS.northEast[0], CASPIAN_BOUNDS.southWest[1]],
						CASPIAN_BOUNDS.southWest,
						],
					],
					{},
					{
						fillColor: '#00bfff22',
						strokeColor: '#00bfff',
						strokeWidth: 2,
						interactivityModel: 'default#transparent', // 🧩 не блокирует клики по карте
					}
					)
					mapRef.current.geoObjects.add(caspianPolygon)
				// Обработка кликов
				mapRef.current.events.add('click', () => {
					if (!pickModeRef.current || !onMapClickRef.current) return
				
					const center = mapRef.current!.getCenter()
					const [lat, lng] = center

					const inCaspian =
						lat >= CASPIAN_BOUNDS.southWest[0] &&
						lat <= CASPIAN_BOUNDS.northEast[0] &&
						lng >= CASPIAN_BOUNDS.southWest[1] &&
						lng <= CASPIAN_BOUNDS.northEast[1]

					if (inCaspian) {
						onMapClickRef.current(lat, lng)
					} else {
						setAlertVisible(true)
						setTimeout(() => setAlertVisible(false), 2500)
					}
				})
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

	// Отображение меток загрязнения
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
				[point.latitude, point.longitude],
				{ balloonContent: balloonHtml },
				{
					iconLayout: 'default#image',
					iconImageHref: 'data:image/svg+xml;base64,' + btoa(svgIcon),
					iconImageSize: [32, 32],
					iconImageOffset: [-16, -16],
				}
			)

			pm.events.add('click', () => onPointSelect(point))
			mapRef.current.geoObjects.add(pm)
			placemarksRef.current.push(pm)
		})
	}, [points, onPointSelect])

	return (
		<div className="relative h-full w-full rounded-lg border overflow-hidden">
			<div ref={containerRef} className="absolute inset-0 h-full w-full" />

			{alertVisible && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade">
					Можно ставить метки только в пределах Каспийского моря 🌊
				</div>
			)}

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
