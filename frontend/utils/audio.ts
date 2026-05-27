import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

let ambientSoundInstance: Audio.Sound | null = null;
let currentAmbientTheme: 'dark' | 'light' | null = null;
let audioModeReady = false;
let playbackGeneration = 0;

const setupAudio = async () => {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeReady = true;
  } catch {}
};

let cachedSettings: { music: boolean, musicVolume: number, sfx: boolean, sfxVolume: number } | null = null;

export const refreshAudioSettings = async () => {
  try {
    const saved = await SecureStore.getItemAsync('userSettings');
    if (!saved) {
      cachedSettings = { music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.5 };
      return cachedSettings;
    }
    const settings = JSON.parse(saved);
    cachedSettings = {
      music: settings.music !== false,
      musicVolume: settings.musicVolume !== undefined ? settings.musicVolume : 0.5,
      sfx: settings.sfx !== false,
      sfxVolume: settings.sfxVolume !== undefined ? settings.sfxVolume : 0.5,
    };
    return cachedSettings;
  } catch {
    cachedSettings = { music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.5 };
    return cachedSettings;
  }
};

const getAudioSettings = async () => {
  if (cachedSettings) return cachedSettings;
  return await refreshAudioSettings();
};

const playOneShot = (asset: number, volume: number) => {
  void (async () => {
    await setupAudio();
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { volume });
      sound.playAsync().catch(() => {});
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch {}
  })();
};

export const playSuccessSound = () => {
  void (async () => {
    const { sfx, sfxVolume } = await getAudioSettings();
    if (!sfx) return;
    playOneShot(require('../assets/sounds/success.mp3'), sfxVolume);
  })();
};

export const playClickSound = () => {
  void (async () => {
    const { sfx, sfxVolume } = await getAudioSettings();
    if (!sfx) return;
    playOneShot(require('../assets/sounds/click.mp3'), sfxVolume);
  })();
};

export const playAmbientSound = async (durationSeconds: number = 0, isDark: boolean = false) => {
  const { music, musicVolume } = await getAudioSettings();
  if (!music) return;

  await setupAudio();
  
  const requestedTheme = isDark ? 'dark' : 'light';
  if (ambientSoundInstance && currentAmbientTheme === requestedTheme) {
    try {
      const status = await ambientSoundInstance.getStatusAsync();
      if (status.isLoaded) {
        await ambientSoundInstance.setVolumeAsync(musicVolume);
        if (!status.isPlaying) await ambientSoundInstance.playAsync();
        return;
      }
    } catch {}
  }

  try {
    await stopAmbientSound();
    
    playbackGeneration++;
    const currentGeneration = playbackGeneration;

    const soundFile = isDark
      ? require('../assets/sounds/bgm_dark.mp3')
      : require('../assets/sounds/bgm.mp3');

    const { sound } = await Audio.Sound.createAsync(
      soundFile,
      { isLooping: true, volume: musicVolume }
    );
    
    if (currentGeneration !== playbackGeneration) {
      await sound.unloadAsync();
      return;
    }

    ambientSoundInstance = sound;
    currentAmbientTheme = requestedTheme;
    await ambientSoundInstance.playAsync();

    if (durationSeconds > 0) {
      setTimeout(() => {
        void stopAmbientSound();
      }, durationSeconds * 1000);
    }
  } catch {}
};

export const setAmbientVolume = async (volume: number) => {
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.setVolumeAsync(volume);
    } catch {}
  }
};

export const stopAmbientSound = async () => {
  playbackGeneration++;
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.stopAsync();
      await ambientSoundInstance.unloadAsync();
      ambientSoundInstance = null;
      currentAmbientTheme = null;
    } catch {}
  }
};
