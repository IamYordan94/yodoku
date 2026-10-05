import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.yodoku',
  appName: 'Yodoku',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: '#141414',
      showSpinner: false,
      launchFadeOutDuration: 250,
    },
  },
};

export default config;
