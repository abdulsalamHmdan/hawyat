import * as ImagePicker from 'expo-image-picker';

import type { ImageFile } from '@/data/types';

/** يختار صورة من الألبوم (فاتورة، تحويل، صورة شخصية). */
export async function pickImage(opts?: { square?: boolean }): Promise<ImageFile | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.6,
    allowsEditing: !!opts?.square,
    aspect: opts?.square ? [1, 1] : undefined,
  });
  if (res.canceled || !res.assets[0]) return null;
  return { uri: res.assets[0].uri, mimeType: res.assets[0].mimeType };
}
