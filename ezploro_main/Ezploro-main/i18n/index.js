import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar los archivos de traducción
import en from './translations/en.json';
import es from './translations/es.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      console.log('Saved language from AsyncStorage:', savedLanguage);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      const deviceLanguage = Localization.locale.split('-')[0];
      console.log('Device language:', deviceLanguage);
      return callback(deviceLanguage);
    } catch (error) {
      console.error('Error detecting language:', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      console.log('Caching language:', language);
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    debug: true // Habilitar depuración
  })
  .then(() => console.log('i18next initialized successfully'))
  .catch(err => console.error('i18next initialization failed:', err));

export default i18n;