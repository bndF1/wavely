import type { CapacitorConfig } from '@capacitor/cli';

const isLocal = process.env['CAP_ENV'] === 'local';

const config: CapacitorConfig = {
  appId: 'io.wavely.app',
  appName: 'Wavely',
  webDir: 'dist/wavely/browser',
  ...(isLocal && {
    server: {
      url: 'http://localhost:4200',
      cleartext: true,
    },
  }),
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#1a73e8',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a73e8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#ffffff',
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
  },
};

export default config;
