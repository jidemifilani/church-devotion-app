import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running inside the Expo Go client app rather than a
 * dev-client/standalone build. Expo Go only supports a fixed set of
 * precompiled native modules — anything with custom native code (like
 * expo-notifications' push functionality or react-native-android-widget)
 * must be skipped here or it crashes on import/use.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
