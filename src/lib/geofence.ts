// الإعلان التلقائي بالموقع: نسجّل حدود المخيم عند النظام، والنظام يصحّي التطبيق لما تدخل أو تطلع.
// ما نرسل ولا نحفظ موقعك؛ بس حدث «دخل/طلع».
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { backend } from '@/data';
import type { Camp } from '@/data/types';

export const GEOFENCE_TASK = 'hawyat-geofence';
const CAMP_KEY = 'hawyat.geofence.camp';

if (Platform.OS !== 'web') {
  TaskManager.defineTask<{ eventType: Location.GeofencingEventType }>(GEOFENCE_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const campId = await AsyncStorage.getItem(CAMP_KEY);
    if (!campId) return;
    const entered = data.eventType === Location.GeofencingEventType.Enter;
    try {
      await backend.geofenceEvent(campId, entered);
    } catch {
      // ما نقدر نسوي شي بالخلفية؛ المرة الجاية يتسجل
    }
  });
}

export type GeofenceResult = 'ok' | 'no_center' | 'denied' | 'unsupported';

export async function startGeofence(camp: Camp): Promise<GeofenceResult> {
  if (Platform.OS === 'web') return 'unsupported';
  if (camp.centerLat == null || camp.centerLng == null) return 'no_center';
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync().catch(() => null);
  if (!bg || bg.status !== 'granted') return 'denied';
  try {
    await AsyncStorage.setItem(CAMP_KEY, camp.id);
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      { identifier: camp.id, latitude: camp.centerLat, longitude: camp.centerLng, radius: camp.radiusM, notifyOnEnter: true, notifyOnExit: true },
    ]);
    return 'ok';
  } catch {
    // Expo Go ما يدعم الموقع بالخلفية؛ يحتاج النسخة الكاملة
    return 'unsupported';
  }
}

export async function stopGeofence() {
  if (Platform.OS === 'web') return;
  await AsyncStorage.removeItem(CAMP_KEY);
  if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

/** موقعك الحالي (لمسؤول الصندوق لما يحدد مركز المخيم). */
export async function currentPosition() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return null;
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: p.coords.latitude, lng: p.coords.longitude };
}
