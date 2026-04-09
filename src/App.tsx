import { useState, useRef, useEffect } from 'react';
import Map from './components/Map/Map';
import Timeline from './components/Timeline/Timeline';
import EventCard from './components/EventCard/EventCard';
import MileageDisplay from './components/MileageDisplay/MileageDisplay';
import { events, LifeEvent } from './data/events';
import './App.css';

const PLAYBACK_SPEED_KM_PER_SEC = 500;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [playingDistanceKm, setPlayingDistanceKm] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const totalDistanceRef = useRef<number>(0);

  useEffect(() => {
    let total = 0;

    for (let i = 0; i < events.length - 1; i++) {
      const curr = events[i];
      const next = events[i + 1];
      const dist = haversine(curr.lat, curr.lng, next.lat, next.lng);
      total += dist;
    }

    totalDistanceRef.current = total;
  }, []);

  // Animate route extension using distance-based progress.
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startTimestampRef.current = null;
      return;
    }

    setPlayingDistanceKm(0);
    startTimestampRef.current = null;

    const tick = (timestamp: number) => {
      if (startTimestampRef.current === null) {
        startTimestampRef.current = timestamp;
      }

      const elapsedSeconds = (timestamp - startTimestampRef.current) / 1000;
      const progressedDistance = elapsedSeconds * PLAYBACK_SPEED_KM_PER_SEC;
      const clampedDistance = Math.min(progressedDistance, totalDistanceRef.current);

      setPlayingDistanceKm(clampedDistance);

      if (clampedDistance >= totalDistanceRef.current) {
        setIsPlaying(false);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  const handlePlay = () => {
    if (isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsPlaying(false);
      setPlayingDistanceKm(null);
      startTimestampRef.current = null;
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">📜 苏轼人生轨迹图</h1>
        <div className="header-controls">
          <MileageDisplay />
          <label className="route-toggle">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
            />
            <span className="route-toggle-label">显示路线</span>
          </label>
          <label className="route-toggle">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            <span className="route-toggle-label">显示地名</span>
          </label>
          <button className="play-button" onClick={handlePlay}>
            {isPlaying ? '⏹ 停止' : '▶ 播放线路'}
          </button>
        </div>
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
          showRoutes={showRoutes}
          showLabels={showLabels}
          playingDistanceKm={playingDistanceKm}
        />
      </main>
      <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
