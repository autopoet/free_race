import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PixelSushi } from '@/components/PixelSushi';
import { RootStackParamList } from '@/navigation/types';
import { BattleScreen } from '@/screens/BattleScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { NicknameScreen } from '@/screens/NicknameScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { ScannerScreen } from '@/screens/ScannerScreen';
import { WaitingScreen } from '@/screens/WaitingScreen';
import { MatchProvider, useMatch } from '@/store/MatchContext';
import { colors, typography } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'sushiking://'],
  config: {
    screens: {
      Home: '',
      Nickname: 'join',
      Waiting: 'waiting',
      Battle: 'battle',
      History: 'history',
      Result: 'result',
    },
  },
};

function Navigator() {
  const { hydrated } = useMatch();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <PixelSushi crowned size={98} />
        <ActivityIndicator color={colors.lacquerRed} style={styles.spinner} />
        <Text style={styles.loadingText}>寿司台准备中…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.rice },
          headerShown: false,
        }}
      >
        <Stack.Screen component={HomeScreen} name="Home" />
        <Stack.Screen component={NicknameScreen} name="Nickname" />
        <Stack.Screen component={WaitingScreen} name="Waiting" />
        <Stack.Screen component={ScannerScreen} name="Scanner" />
        <Stack.Screen component={BattleScreen} name="Battle" />
        <Stack.Screen component={HistoryScreen} name="History" />
        <Stack.Screen component={ResultScreen} name="Result" />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Pixelify: require('../assets/fonts/PixelifySans-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <MatchProvider>
        <StatusBar style="dark" />
        <Navigator />
      </MatchProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rice,
  },
  spinner: {
    marginTop: 24,
  },
  loadingText: {
    marginTop: 14,
    color: colors.mutedSoy,
    fontFamily: typography.regular,
    fontSize: 15,
  },
});
