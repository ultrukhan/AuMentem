import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface CacheOptions extends RequestInit {
  cacheKey: string;
}


export async function fetchWithCache(url: string, options: CacheOptions) {
  const { cacheKey, ...fetchOptions } = options;

  try {
    const networkState = await NetInfo.fetch();
    
    if (networkState.isConnected && networkState.isInternetReachable !== false) {
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        const text = await response.text();
        await AsyncStorage.setItem(cacheKey, text);
        return { ok: true, data: JSON.parse(text), fromCache: false, status: response.status, response };
      }
    }
  } catch (error) {
    console.warn(`Network fetch failed for ${url}, falling back to cache...`, error);
  }

  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      return { ok: true, data: JSON.parse(cachedData), fromCache: true, status: 200 };
    }
  } catch (e) {
    console.error('Error reading cache:', e);
  }

  return { ok: false, data: null, fromCache: false, status: 0 };
}
