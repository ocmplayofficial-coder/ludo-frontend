export const GAME_SOUND_KEY = 'game_sound';
export const GAME_VIBRATION_KEY = 'game_vibration';
export const GAME_THEME_KEY = 'game_theme';
export const APP_THEME_KEY = 'appTheme';
export const GAME_SPEED_KEY = 'game_speed';

const buildKey = (key) => `game_${key}`;
const getStoredValue = (key) => {
  return localStorage.getItem(buildKey(key)) ?? localStorage.getItem(key);
};

export const isSoundEnabled = () => getStoredValue('sound') !== 'false';
export const isVibrationEnabled = () => getStoredValue('vibration') === 'true';
export const getTheme = () => getStoredValue('theme') || 'Classic';
export const getAppTheme = () => getStoredValue(APP_THEME_KEY) || 'Normal';
export const getSpeed = () => getStoredValue('speed') || '1x Normal';

export const setSetting = (key, value) => {
  localStorage.setItem(buildKey(key), String(value));
};

export const playAudio = (audio) => {
  if (!isSoundEnabled()) return;
  if (!audio) return;

  try {
    const playResult = audio.play();
    if (playResult && typeof playResult.then === 'function') {
      playResult.catch(() => {});
    }
  } catch (error) {
    // ignore autoplay restrictions or already playing state
  }
};

export const vibrate = (pattern) => {
  if (!isVibrationEnabled()) return;
  if (window.navigator && typeof window.navigator.vibrate === 'function') {
    window.navigator.vibrate(pattern);
  }
};

export const getBoardThemeStyles = (theme) => {
  switch (theme) {
    case 'Wooden':
      return {
        background: 'linear-gradient(135deg, #8b5a2b 0%, #4b2d0b 50%, #2e1a07 100%)',
        borderColor: '#7f5a2b',
      };
    case 'Neon Night':
      return {
        background: 'radial-gradient(circle at top left, #4c1eff 0%, #0f0f3f 45%, #05010a 100%)',
        borderColor: '#5ce0ff',
      };
    case 'Royal Gold':
      return {
        background: 'radial-gradient(circle at top left, #fff6c9 0%, #d4a40e 45%, #613f0e 100%)',
        borderColor: '#ffd966',
      };
    default:
      return {
        background: '#fff',
        borderColor: '#000',
      };
  }
};
