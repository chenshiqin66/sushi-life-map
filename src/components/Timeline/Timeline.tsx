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
