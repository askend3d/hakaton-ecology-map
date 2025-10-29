import { useEffect, useRef } from "react";
import { PollutionPoint } from "@/types/pollution";
import { MAP_CENTER, MAP_ZOOM, POLLUTION_STATUS_LABELS, POLLUTION_TYPE_LABELS } from "@/lib/constants";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewProps {
  points: PollutionPoint[];
  onPointSelect: (point: PollutionPoint) => void;
  selectedPoint?: PollutionPoint | null;
}

const getMarkerColor = (status: string) => {
  switch (status) {
    case "new":
      return "#ef4444";
    case "in_progress":
      return "#f97316";
    case "cleaned":
      return "#22c55e";
    default:
      return "#3b82f6";
  }
};

const createCustomIcon = (status: string) => {
  const color = getMarkerColor(status);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export function MapView({ points, onPointSelect, selectedPoint }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = L.map(mapContainer.current).setView(MAP_CENTER, MAP_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    points.forEach((point) => {
      if (!mapRef.current) return;

      const marker = L.marker([point.lat, point.lng], {
        icon: createCustomIcon(point.status),
      }).addTo(mapRef.current);

      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 8px;">
            ${POLLUTION_TYPE_LABELS[point.type]}
          </div>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 8px; background-color: ${
            point.status === "new" ? "#fef2f2" : point.status === "in_progress" ? "#fffbeb" : "#f0fdf4"
          }; color: ${
        point.status === "new" ? "#991b1b" : point.status === "in_progress" ? "#92400e" : "#166534"
      };">
            ${POLLUTION_STATUS_LABELS[point.status]}
          </div>
          <p style="font-size: 0.75rem; color: #6b7280; margin-top: 8px;">
            ${point.description}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => onPointSelect(point));

      markersRef.current.push(marker);
    });
  }, [points, onPointSelect]);

  useEffect(() => {
    if (!mapRef.current || !selectedPoint) return;

    mapRef.current.flyTo([selectedPoint.lat, selectedPoint.lng], 15, {
      duration: 1,
    });
  }, [selectedPoint]);

  return <div ref={mapContainer} className="h-full w-full rounded-lg z-10" />;
}
