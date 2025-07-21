import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <MainNavigator />
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  }
}); 