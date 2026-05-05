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
  } catch (e) {
    console.warn(e);
  }
};

const isSoundAllowed = async (type: 'music' | 'sfx'): Promise<boolean> => {
  try {
    const saved = await SecureStore.getItemAsync('userSettings');
    if (!saved) return true;
    const settings = JSON.parse(saved);
    return settings[type] !== false;
  } catch (e) {
    return true; 
  }
};

export const playSuccessSound = async () => {
  const allowed = await isSoundAllowed('sfx');
  if (!allowed) return;

  await setupAudio();
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.mp3')
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {
    console.error(error);
  }
};

export const playClickSound = async () => {
  const allowed = await isSoundAllowed('sfx');
  if (!allowed) return;

  await setupAudio();
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/click.mp3')
    );
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {
    console.error(error);
  }
};

export const playAmbientSound = async (durationSeconds: number = 0) => {
  const allowed = await isSoundAllowed('music');
  if (!allowed) return;

  await setupAudio();
  try {
    await stopAmbientSound();
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/bgm.mp3'),
      { isLooping: true, volume: 0.3 }
    );
    ambientSoundInstance = sound;
    await ambientSoundInstance.playAsync();

    if (durationSeconds > 0) {
      setTimeout(async () => {
        await stopAmbientSound();
      }, durationSeconds * 1000);
    }
  } catch (error) {
    console.error(error);
  }
};

export const stopAmbientSound = async () => {
  if (ambientSoundInstance) {
    try {
      await ambientSoundInstance.stopAsync();
      await ambientSoundInstance.unloadAsync();
      ambientSoundInstance = null;
    } catch (e) {
      console.error(e);
    }
  }
};