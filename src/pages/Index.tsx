import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddPointDialog } from '@/components/AddPointDialog'
import { FilterPanel } from '@/components/FilterPanel'
import { MapView } from '@/components/MapView'
import { PointDetailsSheet } from '@/components/PointDetailsSheet'
import { PollutionCard } from '@/components/PollutionCard'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/context/AuthContext'
import { List, MapIcon } from 'lucide-react'
import { PollutionPoint, PollutionStatus, PollutionType } from '@/types/pollution'

const Index = () => {
  const [points, setPoints] = useState<PollutionPoint[]>([])
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedPoint, setSelectedPoint] = useState<PollutionPoint | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [pickedCoords, setPickedCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [selectedTypes, setSelectedTypes] = useState<PollutionType[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<PollutionStatus[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // 🔹 Загрузка данных с сервера
  useEffect(() => {
    const fetchPoints = async () => {
      setLoadingPoints(true)
      setError(null)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/pollutions/points`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Ошибка загрузки (${response.status})`)
        }

        const data = await response.json()
        setPoints(data)
      } catch (err: any) {
        console.error('Ошибка загрузки точек:', err)
        setError('Не удалось загрузить точки загрязнения.')
      } finally {
        setLoadingPoints(false)
      }
    }

    fetchPoints()
  }, [])

  const filteredPoints = useMemo(() => {
	return points.filter((point) => {
	  const pointType = point.pollution_type?.toLowerCase()
	  const pointStatus = point.status?.toLowerCase()
  
	  const matchesType =
		selectedTypes.length === 0 || selectedTypes.includes(pointType as PollutionType)
	  const matchesStatus =
		selectedStatuses.length === 0 || selectedStatuses.includes(pointStatus as PollutionStatus)
	  const matchesSearch =
		searchQuery === '' ||
		point.description?.toLowerCase().includes(searchQuery.toLowerCase())
  
	  return matchesType && matchesStatus && matchesSearch
	})
  }, [points, selectedTypes, selectedStatuses, searchQuery])
  

  if (loading) return <div className="text-center p-10">Авторизация...</div>
  if (loadingPoints) return <div className="text-center p-10">Загрузка точек...</div>
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>

  const handleAddPoint = (data: Omit<PollutionPoint, 'id'>) => {
    const newPoint: PollutionPoint = { ...data, id: Date.now().toString() }
    setPoints([...points, newPoint])
    setPickedCoords(null)
  }

  const handleStatusChange = (id: string, status: PollutionStatus) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date() } : p)))
  }

  const handlePointClick = (point: PollutionPoint) => {
    setSelectedPoint(point)
    setShowDetails(true)
  }

  const stats = {
    total: points.length,
    new: points.filter((p) => p.status === 'new').length,
    inProgress: points.filter((p) => p.status === 'in_progress').length,
    cleaned: points.filter((p) => p.status === 'cleaned').length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Карта чистоты Каспия</h1>
                <p className="text-sm text-muted-foreground">Экологический мониторинг побережья</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/profile')}
                >
                  Профиль
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Войти
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Всего точек</div>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.new}</div>
              <div className="text-xs text-muted-foreground">Новых</div>
            </div>
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">В работе</div>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-success">{stats.cleaned}</div>
              <div className="text-xs text-muted-foreground">Очищено</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <FilterPanel
              selectedTypes={selectedTypes}
              selectedStatuses={selectedStatuses}
              searchQuery={searchQuery}
              onTypesChange={setSelectedTypes}
              onStatusesChange={setSelectedStatuses}
              onSearchChange={setSearchQuery}
            />

            <div className="hidden lg:block">
              <h3 className="font-semibold mb-3 px-1">
                Точки загрязнения ({filteredPoints.length})
              </h3>
              <ScrollArea className="h-[calc(100vh-520px)] pr-0.5">
                <div className="space-y-2">
                  {filteredPoints.map((point) => (
                    <PollutionCard
                      key={point.id}
                      point={point}
                      onClick={() => handlePointClick(point)}
                      isSelected={selectedPoint?.id === point.id}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Map/List View */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-end lg:hidden">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              >
                {viewMode === 'map' ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                {viewMode === 'map' ? 'Список' : 'Карта'}
              </Button>
            </div>

            {viewMode === 'map' ? (
              <div className="h-[calc(100vh-280px)] lg:h-[calc(100vh-200px)] rounded-lg overflow-hidden border">
                <MapView
                  points={filteredPoints}
                  onPointSelect={handlePointClick}
                  selectedPoint={selectedPoint}
                  pickMode={true}
                  onMapClick={(lat, lng) => {
                    setPickedCoords({ lat, lng })
                    if (!showAddDialog) setShowAddDialog(true)
                  }}
                  onCenterChange={(lat, lng) => setPickedCoords({ lat, lng })}
                />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {filteredPoints.map((point) => (
                    <PollutionCard
                      key={point.id}
                      point={point}
                      onClick={() => handlePointClick(point)}
                      isSelected={selectedPoint?.id === point.id}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddPointDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddPoint}
        coords={pickedCoords}
      />
      <PointDetailsSheet
        point={selectedPoint}
        open={showDetails}
        onOpenChange={setShowDetails}
        onStatusChange={handleStatusChange}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}

export default Index
