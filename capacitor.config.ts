import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skatetrack.app',
  appName: 'Skate Track',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  }
};

export default config;
