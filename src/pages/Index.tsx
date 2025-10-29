import { useState, useMemo } from "react";
import { MapView } from "@/components/MapView";
import { PollutionCard } from "@/components/PollutionCard";
import { FilterPanel } from "@/components/FilterPanel";
import { AddPointDialog } from "@/components/AddPointDialog";
import { PointDetailsSheet } from "@/components/PointDetailsSheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PollutionPoint, PollutionStatus, PollutionType } from "@/types/pollution";
import { mockPollutionPoints } from "@/lib/mockData";
import { Plus, MapIcon, List, Shield } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [points, setPoints] = useState<PollutionPoint[]>(mockPollutionPoints);
  const [selectedPoint, setSelectedPoint] = useState<PollutionPoint | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<PollutionType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<PollutionStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(point.type);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(point.status);
      const matchesSearch = searchQuery === "" || point.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [points, selectedTypes, selectedStatuses, searchQuery]);

  const handleAddPoint = (data: any) => {
    const newPoint: PollutionPoint = {
      ...data,
      id: Date.now().toString(),
    };
    setPoints([...points, newPoint]);
  };

  const handleStatusChange = (id: string, status: PollutionStatus) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date() } : p)));
  };

  const handlePointClick = (point: PollutionPoint) => {
    setSelectedPoint(point);
    setShowDetails(true);
  };

  const stats = {
    total: points.length,
    new: points.filter((p) => p.status === "new").length,
    inProgress: points.filter((p) => p.status === "in_progress").length,
    cleaned: points.filter((p) => p.status === "cleaned").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
              <Button
                variant={isAdmin ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsAdmin(!isAdmin);
                  toast.success(isAdmin ? "Режим администратора выключен" : "Режим администратора включен");
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isAdmin ? "Администратор" : "Волонтер"}
              </Button>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить точку
              </Button>
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
              <ScrollArea className="h-[calc(100vh-520px)]">
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
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
              >
                {viewMode === "map" ? <List className="w-4 h-4 mr-2" /> : <MapIcon className="w-4 h-4 mr-2" />}
                {viewMode === "map" ? "Список" : "Карта"}
              </Button>
            </div>

            {viewMode === "map" ? (
              <div className="h-[calc(100vh-280px)] lg:h-[calc(100vh-200px)] rounded-lg overflow-hidden border">
                <MapView
                  points={filteredPoints}
                  onPointSelect={handlePointClick}
                  selectedPoint={selectedPoint}
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
      <AddPointDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddPoint} />
      <PointDetailsSheet
        point={selectedPoint}
        open={showDetails}
        onOpenChange={setShowDetails}
        onStatusChange={handleStatusChange}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default Index;
