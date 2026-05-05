import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

let ambientSoundInstance: Audio.Sound | null = null;

const setupAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {}
};

const getAudioSettings = async () => {
  try {
    const saved = await SecureStore.getItemAsync('userSettings');
    if (!saved) return { music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.5 };
    const settings = JSON.parse(saved);
    return {
      music: settings.music !== false,
      musicVolume: settings.musicVolume !== undefined ? settings.musicVolume : 0.5,
      sfx: settings.sfx !== false,
      sfxVolume: settings.sfxVolume !== undefined ? settings.sfxVolume : 0.5,
    };
  } catch (e) {
    return { music: true, musicVolume: 0.5, sfx: true, sfxVolume: 0.5 };
  }
};

export const playSuccessSound = async () => {
  const { sfx, sfxVolume } = await getAudioSettings();
  if (!sfx) return;

  await setupAudio();
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.mp3'),
      { volume: sfxVolume }
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {}
};

export const playClickSound = async () => {
  const { sfx, sfxVolume } = await getAudioSettings();
  if (!sfx) return;

  await setupAudio();
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3'),
      { volume: sfxVolume }
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {}
};

export const playAmbientSound = async (durationSeconds: number = 0) => {
  const { music, musicVolume } = await getAudioSettings();
  if (!music) return;

  await setupAudio();
  try {
    await stopAmbientSound();
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/bgm.mp3'),
      { isLooping: true, volume: musicVolume }
    );
    ambientSoundInstance = sound;
    await ambientSoundInstance.playAsync();

    if (durationSeconds > 0) {
      setTimeout(async () => {
        await stopAmbientSound();
      }, durationSeconds * 1000);
    }
  } catch (error) {}
};

export const setAmbientVolume = async (volume: number) => {
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.setVolumeAsync(volume);
    } catch (e) {}
  }
};

export const stopAmbientSound = async () => {
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.stopAsync();
      await ambientSoundInstance.unloadAsync();
      ambientSoundInstance = null;
    } catch (e) {}
  }
};