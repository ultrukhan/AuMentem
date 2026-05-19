import { BASE_URL } from '@/constants/api';

export async function shouldShowTrackerToday(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/Tracker/check-today`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.show_tracker === true;
  } catch {
    return false;
  }
}
