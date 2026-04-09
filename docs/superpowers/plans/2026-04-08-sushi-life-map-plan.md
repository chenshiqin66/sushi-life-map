# 苏轼人生轨迹交互地图 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 React + Vite 的单页应用，在 Leaflet 交互地图上标注苏轼一生21个关键事件，支持时间轴浏览、详情查看和总旅程里程计算。

**Architecture:** 使用 Vite + React 初始化项目，Leaflet.js 渲染地图，自研时间轴组件，Haversine 公式计算里程。所有状态由 React useState 管理，组件化拆分（Map、Timeline、EventCard、MileageDisplay）。

**Tech Stack:** React 18, Vite, Leaflet.js, OpenStreetMap, TypeScript, CSS

---

## 文件结构

```
src/
├── data/
│   └── events.ts          # 苏轼生平事件数据（21个节点）
├── utils/
│   └── haversine.ts       # Haversine 里程计算
├── components/
│   ├── Map/
│   │   └── Map.tsx         # Leaflet 地图组件
│   ├── Timeline/
│   │   └── Timeline.tsx    # 时间轴组件
│   ├── EventCard/
│   │   └── EventCard.tsx   # 详情卡片组件
│   └── MileageDisplay/
│       └── MileageDisplay.tsx  # 里程显示组件
├── App.tsx                 # 主布局组件
├── App.css                 # 全局样式
└── main.tsx               # 入口
```

---

## 任务分解

### Task 1: 初始化项目并安装依赖

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "sushi-life-map",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>苏轼人生轨迹图</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: 创建 src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: 安装依赖**

Run: `cd D:\CCDP\MAP-Project && npm install`
Expected: 安装完成，无 error

---

### Task 2: 创建数据层 — 苏轼生平事件数据

**Files:**
- Create: `src/data/events.ts`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 src/data/events.ts**

```ts
export interface LifeEvent {
  id: string;
  year: number;
  title: string;
  location: string;
  lat: number;
  lng: number;
  description: string;
  poems?: string[];
  type: 'birth' | 'official' | 'exile' | 'death' | 'other';
}

export const events: LifeEvent[] = [
  {
    id: '1',
    year: 1037,
    title: '出生于眉山',
    location: '眉山',
    lat: 30.0575,
    lng: 103.8486,
    description: '出生于眉州眉山县，苏轼，字子瞻，号东坡居士。',
    type: 'birth',
  },
  {
    id: '2',
    year: 1056,
    title: '随父赴京',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '随父苏洵、弟苏辙赴汴京，准备应试。',
    type: 'other',
  },
  {
    id: '3',
    year: 1057,
    title: '中进士',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '中进士，母程氏病逝，返蜀奔丧。',
    type: 'official',
  },
  {
    id: '4',
    year: 1061,
    title: '签书凤翔府判官',
    location: '凤翔',
    lat: 34.3529,
    lng: 107.2370,
    description: '授大理评事、签书凤翔府判官，这是苏轼第一次正式任职。',
    type: 'official',
  },
  {
    id: '5',
    year: 1065,
    title: '妻王弗卒',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '判登闻鼓院，妻子王弗病逝于京师。',
    type: 'other',
  },
  {
    id: '6',
    year: 1069,
    title: '父苏洵卒',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '父苏洵病逝于京师，苏轼兄弟护柩归蜀，丁忧三年。',
    type: 'other',
  },
  {
    id: '7',
    year: 1071,
    title: '任告院监支告院',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '服满返京，任告院监支告院。',
    type: 'official',
  },
  {
    id: '8',
    year: 1072,
    title: '通判杭州',
    location: '杭州',
    lat: 30.2741,
    lng: 120.1551,
    description: '通判杭州，与僚友游西湖，作大量诗词。',
    type: 'official',
  },
  {
    id: '9',
    year: 1074,
    title: '知密州',
    location: '密州',
    lat: 35.8787,
    lng: 119.9405,
    description: '知密州，与王弗之堂妹王闰之结婚，作《江城子·乙卯正月二十日夜记梦》。',
    type: 'official',
  },
  {
    id: '10',
    year: 1077,
    title: '知徐州',
    location: '徐州',
    lat: 34.2044,
    lng: 117.2859,
    description: '知徐州，任期内治理水患，建黄楼。',
    type: 'official',
  },
  {
    id: '11',
    year: 1079,
    title: '乌台诗案',
    location: '湖州',
    lat: 30.7602,
    lng: 120.1697,
    description: '知湖州，"乌台诗案"发，被捕入狱，几乎处死。',
    type: 'official',
  },
  {
    id: '12',
    year: 1080,
    title: '贬黄州',
    location: '黄州',
    lat: 30.4534,
    lng: 114.8626,
    description: '贬黄州团练副使，不得签书公事。在此创作《念奴娇·赤壁怀古》、《赤壁赋》等千古名篇。',
    poems: ['念奴娇·赤壁怀古', '前赤壁赋', '后赤壁赋'],
    type: 'exile',
  },
  {
    id: '13',
    year: 1086,
    title: '翰林学士',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '神宗崩，哲宗即位，召还朝，任翰林学士。',
    type: 'official',
  },
  {
    id: '14',
    year: 1089,
    title: '知杭州',
    location: '杭州',
    lat: 30.2741,
    lng: 120.1551,
    description: '知杭州，疏浚西湖，建苏堤，植芙蓉。',
    type: 'official',
  },
  {
    id: '15',
    year: 1091,
    title: '得知常州',
    location: '常州',
    lat: 31.8106,
    lng: 119.9740,
    description: '得知常州，途中作《定风波·莫听穿林打叶声》。',
    poems: ['定风波·莫听穿林打叶声'],
    type: 'official',
  },
  {
    id: '16',
    year: 1093,
    title: '妻王闰之卒',
    location: '汴京',
    lat: 34.7466,
    lng: 113.6253,
    description: '妻子王闰之卒于京师，苏轼悲痛不已。',
    type: 'other',
  },
  {
    id: '17',
    year: 1097,
    title: '贬惠州',
    location: '惠州',
    lat: 23.1115,
    lng: 114.4158,
    description: '贬惠州，宁远军节度副使不得签书公事。在惠州作"日啖荔枝三百颗"等诗。',
    poems: ['惠州一绝'],
    type: 'exile',
  },
  {
    id: '18',
    year: 1097,
    title: '再贬儋州',
    location: '儋州',
    lat: 19.5215,
    lng: 109.5766,
    description: '再贬儋州，在海南岛度过了三年艰难岁月。',
    type: 'exile',
  },
  {
    id: '19',
    year: 1100,
    title: '贬廉州',
    location: '廉州',
    lat: 21.6167,
    lng: 109.2833,
    description: '徽宗即位，苏轼量移廉州合浦。',
    type: 'exile',
  },
  {
    id: '20',
    year: 1100,
    title: '移永州',
    location: '永州',
    lat: 26.4205,
    lng: 111.6133,
    description: '移永州安置，尚未到任。',
    type: 'other',
  },
  {
    id: '21',
    year: 1101,
    title: '病逝于常州',
    location: '常州',
    lat: 31.8106,
    lng: 119.9740,
    description: '病逝于常州，享年65岁。一代文豪走完了他跌宕起伏的一生。',
    poems: ['自题金山画像'],
    type: 'death',
  },
];
```

---

### Task 3: 创建工具层 — Haversine 里程计算

**Files:**
- Create: `src/utils/haversine.ts`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 src/utils/haversine.ts**

```ts
import { events } from '../data/events';

/**
 * 使用 Haversine 公式计算两个经纬度点之间的球面距离（公里）
 */
function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 地球半径（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 计算苏轼一生总旅程里程（按时间顺序累加相邻节点间的球面距离）
 */
export function calculateTotalMileage(): number {
  let total = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];
    total += haversine(curr.lat, curr.lng, next.lat, next.lng);
  }
  return Math.round(total);
}

/**
 * 计算两站之间的直接距离
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.round(haversine(lat1, lng1, lat2, lng2));
}
```

---

### Task 4: 创建 MileageDisplay 组件

**Files:**
- Create: `src/components/MileageDisplay/MileageDisplay.tsx`, `src/components/MileageDisplay/MileageDisplay.css`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 MileageDisplay.tsx**

```tsx
import { calculateTotalMileage } from '../../utils/haversine';
import './MileageDisplay.css';

export default function MileageDisplay() {
  const totalMileage = calculateTotalMileage();

  return (
    <div className="mileage-display">
      <span className="mileage-label">总旅程</span>
      <span className="mileage-value">{totalMileage.toLocaleString()} 公里</span>
    </div>
  );
}
```

- [ ] **Step 2: 创建 MileageDisplay.css**

```css
.mileage-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mileage-label {
  font-size: 14px;
  color: #666;
}

.mileage-value {
  font-size: 18px;
  font-weight: 700;
  color: #c0392b;
}
```

---

### Task 5: 创建 EventCard 组件

**Files:**
- Create: `src/components/EventCard/EventCard.tsx`, `src/components/EventCard/EventCard.css`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 EventCard.tsx**

```tsx
import { LifeEvent } from '../../data/events';
import './EventCard.css';

interface Props {
  event: LifeEvent | null;
  onClose: () => void;
}

export default function EventCard({ event, onClose }: Props) {
  if (!event) return null;

  return (
    <div className="event-card">
      <button className="event-card-close" onClick={onClose}>&times;</button>
      <div className="event-card-header">
        <span className={`event-type-badge event-type-${event.type}`}>
          {event.type === 'birth' ? '出生' :
           event.type === 'official' ? '仕宦' :
           event.type === 'exile' ? '贬谪' :
           event.type === 'death' ? '去世' : '其他'}
        </span>
        <span className="event-year">{event.year}年</span>
      </div>
      <h3 className="event-title">{event.title}</h3>
      <p className="event-location">📍 {event.location}</p>
      <p className="event-description">{event.description}</p>
      {event.poems && event.poems.length > 0 && (
        <div className="event-poems">
          <p className="poems-label">代表作品：</p>
          <ul>
            {event.poems.map((poem, i) => (
              <li key={i}>{poem}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 EventCard.css**

```css
.event-card {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 340px;
  max-height: 420px;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 20px;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.event-card-close {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.event-card-close:hover {
  color: #333;
}

.event-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.event-type-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.event-type-birth { background: #27ae60; }
.event-type-official { background: #2980b9; }
.event-type-exile { background: #c0392b; }
.event-type-death { background: #7f8c8d; }
.event-type-other { background: #f39c12; }

.event-year {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.event-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #2c3e50;
}

.event-location {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.event-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.event-poems .poems-label {
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: #888;
}

.event-poems ul {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: #c0392b;
}

.event-poems li {
  margin-bottom: 4px;
}
```

---

### Task 6: 创建 Timeline 组件

**Files:**
- Create: `src/components/Timeline/Timeline.tsx`, `src/components/Timeline/Timeline.css`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 Timeline.tsx**

```tsx
import { LifeEvent } from '../../data/events';
import './Timeline.css';

interface Props {
  events: LifeEvent[];
  selectedId: string | null;
  onSelect: (event: LifeEvent) => void;
}

export default function Timeline({ events, selectedId, onSelect }: Props) {
  return (
    <div className="timeline">
      <div className="timeline-title">苏轼生平</div>
      <div className="timeline-list">
        {events.map((event) => (
          <button
            key={event.id}
            className={`timeline-item ${selectedId === event.id ? 'active' : ''} event-type-${event.type}`}
            onClick={() => onSelect(event)}
          >
            <span className="timeline-year">{event.year}</span>
            <span className="timeline-location">{event.location}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 Timeline.css**

```css
.timeline {
  width: 180px;
  height: 100%;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.timeline-title {
  padding: 16px 12px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.timeline-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-left: 3px solid transparent;
  text-align: left;
  transition: all 0.2s;
}

.timeline-item:hover {
  background: #f5f5f5;
}

.timeline-item.active {
  background: #e8f4fd;
  border-left-color: #2980b9;
}

.timeline-item.event-type-birth { border-left-color: #27ae60; }
.timeline-item.event-type-official { border-left-color: #2980b9; }
.timeline-item.event-type-exile { border-left-color: #c0392b; }
.timeline-item.event-type-death { border-left-color: #7f8c8d; }
.timeline-item.event-type-other { border-left-color: #f39c12; }

.timeline-year {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
}

.timeline-location {
  font-size: 12px;
  color: #666;
}
```

---

### Task 7: 创建 Map 组件

**Files:**
- Create: `src/components/Map/Map.tsx`, `src/components/Map/Map.css`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 Map.tsx**

```tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LifeEvent } from '../../data/events';
import './Map.css';

interface Props {
  events: LifeEvent[];
  selectedEvent: LifeEvent | null;
  onSelectEvent: (event: LifeEvent) => void;
}

const TYPE_COLORS: Record<LifeEvent['type'], string> = {
  birth: '#27ae60',
  official: '#2980b9',
  exile: '#c0392b',
  death: '#7f8c8d',
  other: '#f39c12',
};

function createIcon(type: LifeEvent['type']) {
  const color = TYPE_COLORS[type];
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 16px;
      height: 16px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function Map({ events, selectedEvent, onSelectEvent }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: [30, 110],
      zoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    events.forEach((event) => {
      const marker = L.marker([event.lat, event.lng], {
        icon: createIcon(event.type),
      })
        .addTo(map)
        .bindTooltip(event.location, { direction: 'top', offset: [0, -8] })
        .on('click', () => onSelectEvent(event));

      markersRef.current.set(event.id, marker);
    });
  }, [events, onSelectEvent]);

  useEffect(() => {
    if (selectedEvent && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedEvent.lat, selectedEvent.lng], 8, {
        duration: 1,
      });
    }
  }, [selectedEvent]);

  return <div ref={mapRef} className="map-container" />;
}
```

- [ ] **Step 2: 创建 Map.css**

```css
.map-container {
  width: 100%;
  height: 100%;
}

.custom-marker {
  background: transparent;
  border: none;
}

.leaflet-tooltip {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}
```

---

### Task 8: 创建主 App 组件

**Files:**
- Create: `src/App.tsx`, `src/App.css`
- Modify: (none)
- Test: (none)

- [ ] **Step 1: 创建 App.tsx**

```tsx
import { useState } from 'react';
import Map from './components/Map/Map';
import Timeline from './components/Timeline/Timeline';
import EventCard from './components/EventCard/EventCard';
import MileageDisplay from './components/MileageDisplay/MileageDisplay';
import { events, LifeEvent } from './data/events';
import './App.css';

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">📜 苏轼人生轨迹图</h1>
        <MileageDisplay />
      </header>
      <main className="app-main">
        <Timeline
          events={events}
          selectedId={selectedEvent?.id ?? null}
          onSelect={setSelectedEvent}
        />
        <Map
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
        />
      </main>
      <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
```

- [ ] **Step 2: 创建 App.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #2c3e50;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
```

---

## Spec 覆盖自检

| 设计要求 | 对应任务 |
|---------|---------|
| Leaflet 地图渲染 | Task 7 |
| 21 个事件点标注 | Task 2 + Task 7 |
| 不同颜色区分事件类型 | Task 7 |
| 时间轴面板 + 点击跳转 | Task 6 |
| 详情卡片弹窗 | Task 5 |
| Haversine 总里程计算 | Task 3 + Task 4 |
| 飞往选中地点动画 | Task 7 |

---

**Plan 完成并保存至 `docs/superpowers/plans/2026-04-08-sushi-life-map-plan.md`**

两种执行方式：

1. **Subagent-Driven（推荐）** — 每个 Task 分配给独立子 agent 处理，完成后我来审查，快速迭代
2. **Inline Execution** — 在本 session 中批量执行任务

您希望用哪种方式？
