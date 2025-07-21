import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VenueSearch from '../../components/VenueSearch';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <VenueSearch />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
});