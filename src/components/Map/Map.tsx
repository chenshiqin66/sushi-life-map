import { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { LifeEvent } from '../../data/events';
import { haversine } from '../../utils/haversine';
import './Map.css';

/** 高德 JS API 在浏览器侧加载，类型由运行时提供 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AMapAny = any;

interface Props {
  events: LifeEvent[];
  selectedEvent: LifeEvent | null;
  onSelectEvent: (event: LifeEvent) => void;
  showRoutes: boolean;
  showLabels: boolean;
  playingDistanceKm: number | null;
}

const TYPE_COLORS: Record<LifeEvent['type'], string> = {
  birth: '#27ae60',
  official: '#2980b9',
  exile: '#c0392b',
  death: '#7f8c8d',
  other: '#f39c12',
};

function createMarkerContent(type: LifeEvent['type']): HTMLDivElement {
  const color = TYPE_COLORS[type];
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.innerHTML = `<div style="
    width: 18px;
    height: 18px;
    background: ${color};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.45);
  "></div>`;
  return el;
}

/** 同一经纬度的多个事件在地图上环形错开，避免目标点完全重叠看不见 */
function getMarkerDisplayPositions(
  events: LifeEvent[]
): globalThis.Map<string, { lat: number; lng: number }> {
  const groups = new globalThis.Map<string, LifeEvent[]>();
  events.forEach((e) => {
    const key = `${e.lat.toFixed(5)},${e.lng.toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });
  const out = new globalThis.Map<string, { lat: number; lng: number }>();
  const stackRadius = 0.004;

  groups.forEach((list: LifeEvent[]) => {
    const n = list.length;
    list.forEach((e: LifeEvent, i: number) => {
      if (n === 1) {
        out.set(e.id, { lat: e.lat, lng: e.lng });
        return;
      }
      const angle = (i / n) * 2 * Math.PI + Math.PI / 4;
      const lat = e.lat + stackRadius * Math.sin(angle);
      const lng =
        e.lng + (stackRadius * Math.cos(angle)) / Math.cos((e.lat * Math.PI) / 180);
      out.set(e.id, { lat, lng });
    });
  });
  return out;
}

export default function Map({
  events,
  selectedEvent,
  onSelectEvent,
  showRoutes,
  showLabels,
  playingDistanceKm,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMapAny | null>(null);
  const amapRef = useRef<AMapAny | null>(null);
  const markersRef = useRef<globalThis.Map<string, AMapAny>>(new globalThis.Map());
  const polylinesRef = useRef<AMapAny[]>([]);
  const labelsRef = useRef<AMapAny[]>([]);
  const nameLabelsRef = useRef<AMapAny[]>([]);
  const playingPolylinesRef = useRef<AMapAny[]>([]);
  const playingLabelsRef = useRef<AMapAny[]>([]);
  /** 简易行政区图层（省界等），与底图分离便于随地图销毁 */
  const districtLayerRef = useRef<AMapAny | null>(null);
  const satelliteLayerRef = useRef<AMapAny | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_KEY as string | undefined;
    const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE as string | undefined;
    if (!key) {
      setLoadError(
        '请在项目根目录创建 .env，并设置 VITE_AMAP_KEY（Web 端 Key）与 VITE_AMAP_SECURITY_JS_CODE（安全密钥），二者均在高德控制台同一应用下查看。'
      );
      return;
    }

    let cancelled = false;

    // 必须在加载 JS API 脚本之前配置（高德 2.0 新 Key 与安全密钥配对使用）
    if (typeof window !== 'undefined' && securityJsCode) {
      (window as Window & { _AMapSecurityConfig?: { securityJsCode: string } })._AMapSecurityConfig = {
        securityJsCode,
      };
    }

    AMapLoader.load({
      key,
      version: '2.0',
      plugins: ['AMap.DistrictLayer'],
    })
      .then((AMap: AMapAny) => {
        if (cancelled || !mapDivRef.current) return;
        amapRef.current = AMap;
        /**
         * bg：绿地/水系等面状底图；point：行政区划与地名注记（随缩放显示省/市/县等，无法在前端单独锁「仅县」）。
         * 不含 road / building，避免现代路网、楼块干扰。
         */
        const map = new AMap.Map(mapDivRef.current, {
          zoom: 5,
          center: [110, 30],
          features: ['bg', 'point'],
        });
        map.setFeatures?.(['bg', 'point']);

        // 卫星影像作为「地形感」底图（山体、地表纹理）；注记仍由上层矢量 point 绘制
        try {
          if (AMap.TileLayer?.Satellite) {
            const satellite = new AMap.TileLayer.Satellite({
              zIndex: 4,
              opacity: 0.75,
            });
            map.add(satellite);
            satelliteLayerRef.current = satellite;
          }
        } catch {
          /* 部分环境无卫星图层时仍可仅用矢量底图 */
        }

        // 中国行政区边界（depth 3：可显示至区县一级边界，依高德数据为准）
        try {
          if (AMap.DistrictLayer?.Country) {
            const district = new AMap.DistrictLayer.Country({
              zIndex: 12,
              SOC: 'CHN',
              depth: 3,
              zooms: [3, 18],
            });
            district.setStyles({
              'stroke-width': 1.2,
              'nation-stroke': '#475569',
              'province-stroke': '#64748b',
              'city-stroke': '#94a3b8',
              'county-stroke': '#cbd5e1',
              fill: () => 'rgba(248, 250, 252, 0.12)',
            });
            map.add(district);
            districtLayerRef.current = district;
          }
        } catch {
          /* ignore */
        }

        mapInstanceRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        setLoadError(
          '高德地图脚本加载失败：请检查 Key / 安全密钥是否与控制台一致、是否已开通「Web 端(JS API)」，并确认 .env 中已配置 VITE_AMAP_SECURITY_JS_CODE（新 Key 通常必填）。'
        );
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      const map = mapInstanceRef.current;
      if (satelliteLayerRef.current && map) {
        try {
          map.remove(satelliteLayerRef.current);
        } catch {
          /* ignore */
        }
        satelliteLayerRef.current = null;
      }
      if (districtLayerRef.current && map) {
        try {
          map.remove(districtLayerRef.current);
        } catch {
          /* ignore */
        }
        districtLayerRef.current = null;
      }
      if (map) {
        map.destroy();
        mapInstanceRef.current = null;
      }
      amapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    const posMap = getMarkerDisplayPositions(events);

    events.forEach((event) => {
      const p = posMap.get(event.id)!;
      const marker = new AMap.Marker({
        position: [p.lng, p.lat],
        content: createMarkerContent(event.type),
        offset: new AMap.Pixel(-9, -9),
        zIndex: 200,
        label: {
          content: `${event.year} ${event.location}`,
          direction: 'top',
        },
      });
      marker.setMap(map);
      marker.on('click', () => onSelectEvent(event));
      markersRef.current.set(event.id, marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
    };
  }, [mapReady, events, onSelectEvent]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;

    nameLabelsRef.current.forEach((m) => m.setMap(null));
    nameLabelsRef.current = [];

    if (!showLabels) return;

    const posMap = getMarkerDisplayPositions(events);

    events.forEach((event) => {
      const p = posMap.get(event.id)!;
      const labelText = event.modernName
        ? `${event.location}（${event.modernName}）`
        : event.location;

      const el = document.createElement('div');
      el.className = 'name-label';
      el.innerHTML = `<div class="name-label-text">${labelText}</div>`;

      const marker = new AMap.Marker({
        position: [p.lng, p.lat],
        content: el,
        offset: new AMap.Pixel(-60, 4),
        zIndex: 190,
        bubble: false,
      });
      marker.setMap(map);
      nameLabelsRef.current.push(marker);
    });

    return () => {
      nameLabelsRef.current.forEach((m) => m.setMap(null));
      nameLabelsRef.current = [];
    };
  }, [mapReady, showLabels, events]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    if (!map || !selectedEvent) return;

    map.setZoomAndCenter(8, [selectedEvent.lng, selectedEvent.lat], false, 800);
  }, [mapReady, selectedEvent]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    labelsRef.current.forEach((m) => m.setMap(null));
    labelsRef.current = [];

    if (!showRoutes) return;

    for (let i = 0; i < events.length - 1; i++) {
      const curr = events[i];
      const next = events[i + 1];

      const polyline = new AMap.Polyline({
        path: [
          [curr.lng, curr.lat],
          [next.lng, next.lat],
        ],
        strokeColor: '#e67e22',
        strokeWeight: 2,
        strokeOpacity: 0.7,
        strokeStyle: 'dashed',
      });
      polyline.setMap(map);
      polylinesRef.current.push(polyline);

      const dist = haversine(curr.lat, curr.lng, next.lat, next.lng);
      const midLat = (curr.lat + next.lat) / 2;
      const midLng = (curr.lng + next.lng) / 2;

      const el = document.createElement('div');
      el.className = 'route-label';
      el.innerHTML = `<div style="
        background: rgba(230, 126, 34, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      ">${Math.round(dist)} km</div>`;

      const label = new AMap.Marker({
        position: [midLng, midLat],
        content: el,
        offset: new AMap.Pixel(-30, -10),
        bubble: false,
      });
      label.setMap(map);
      labelsRef.current.push(label);
    }

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      labelsRef.current.forEach((m) => m.setMap(null));
      labelsRef.current = [];
    };
  }, [mapReady, showRoutes, events]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapInstanceRef.current;
    const AMap = amapRef.current;
    if (!map || !AMap) return;

    playingPolylinesRef.current.forEach((p) => p.setMap(null));
    playingPolylinesRef.current = [];
    playingLabelsRef.current.forEach((m) => m.setMap(null));
    playingLabelsRef.current = [];

    if (playingDistanceKm === null) return;

    let remainingDistance = playingDistanceKm;

    for (let i = 0; i < events.length - 1 && remainingDistance > 0; i++) {
      const curr = events[i];
      const next = events[i + 1];
      const segmentDistance = haversine(curr.lat, curr.lng, next.lat, next.lng);
      const progressedInSegment = Math.min(remainingDistance, segmentDistance);
      const progressRatio = segmentDistance === 0 ? 1 : progressedInSegment / segmentDistance;
      const isCurrentExtendingSegment = progressedInSegment < segmentDistance;
      const targetLat = curr.lat + (next.lat - curr.lat) * progressRatio;
      const targetLng = curr.lng + (next.lng - curr.lng) * progressRatio;

      const polyline = new AMap.Polyline({
        path: [
          [curr.lng, curr.lat],
          [targetLng, targetLat],
        ],
        strokeColor: isCurrentExtendingSegment ? '#e74c3c' : '#27ae60',
        strokeWeight: isCurrentExtendingSegment ? 3 : 2,
        strokeOpacity: isCurrentExtendingSegment ? 1 : 0.8,
        strokeStyle: isCurrentExtendingSegment ? 'solid' : 'dashed',
      });
      polyline.setMap(map);
      playingPolylinesRef.current.push(polyline);

      const dist = haversine(curr.lat, curr.lng, next.lat, next.lng);
      const midLat = (curr.lat + next.lat) / 2;
      const midLng = (curr.lng + next.lng) / 2;

      if (progressRatio >= 1) {
        const el = document.createElement('div');
        el.className = 'route-label';
        el.innerHTML = `<div style="
          background: rgba(39, 174, 96, 0.9);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        ">${Math.round(dist)} km</div>`;

        const label = new AMap.Marker({
          position: [midLng, midLat],
          content: el,
          offset: new AMap.Pixel(-30, -10),
          bubble: false,
        });
        label.setMap(map);
        playingLabelsRef.current.push(label);
      }

      remainingDistance -= segmentDistance;
    }

    return () => {
      playingPolylinesRef.current.forEach((p) => p.setMap(null));
      playingPolylinesRef.current = [];
      playingLabelsRef.current.forEach((m) => m.setMap(null));
      playingLabelsRef.current = [];
    };
  }, [mapReady, playingDistanceKm, events]);

  return (
    <div className="map-shell">
      <div ref={mapDivRef} className="map-container" />
      {loadError ? <div className="map-error">{loadError}</div> : null}
    </div>
  );
}
