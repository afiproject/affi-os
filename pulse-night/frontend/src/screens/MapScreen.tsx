import React, { useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { PlacePin } from '../components/PlacePin';
import { TimeWeatherBar } from '../components/TimeWeatherBar';
import { SENDAI_CENTER, PLACES } from '../constants/places';
import { COLORS, CATEGORY_LABELS } from '../constants/theme';
import { Place } from '../types/place';

// ダークモードの地図スタイル
const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

export const MapScreen: React.FC = () => {
  const handlePinPress = useCallback((place: Place) => {
    // MVP: ピンタップ時にアラートで情報表示（後で詳細画面に置き換え）
    Alert.alert(
      place.name,
      `カテゴリ: ${CATEGORY_LABELS[place.category]}`,
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={SENDAI_CENTER}
        customMapStyle={mapDarkStyle}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {PLACES.map((place) => (
          <PlacePin key={place.id} place={place} onPress={handlePinPress} />
        ))}
      </MapView>

      <TimeWeatherBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
});
