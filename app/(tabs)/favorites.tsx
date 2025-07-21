import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FavoritesManager from '../../components/FavoritesManager';

export default function FavoritesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FavoritesManager />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
});