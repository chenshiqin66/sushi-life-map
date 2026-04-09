import { events } from '../data/events';

/**
 * 使用 Haversine 公式计算两个经纬度点之间的球面距离（公里）
 */
export function haversine(
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
