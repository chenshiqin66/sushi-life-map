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
