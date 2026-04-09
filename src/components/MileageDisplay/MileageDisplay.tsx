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
