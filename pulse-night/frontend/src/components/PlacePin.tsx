import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Place } from '../types/place';
import { COLORS, CATEGORY_LABELS, CATEGORY_EMOJI } from '../constants/theme';

interface PlacePinProps {
  place: Place;
  onPress: (place: Place) => void;
}

export const PlacePin: React.FC<PlacePinProps> = ({ place, onPress }) => {
  const pinColor = COLORS.pin[place.category];
  const emoji = CATEGORY_EMOJI[place.category];

  return (
    <Marker
      coordinate={{
        latitude: place.latitude,
        longitude: place.longitude,
      }}
      onPress={() => onPress(place)}
    >
      {/* カスタムピン */}
      <View style={[styles.pinContainer, { backgroundColor: pinColor }]}>
        <Text style={styles.pinEmoji}>{emoji}</Text>
      </View>
      <View style={[styles.pinArrow, { borderTopColor: pinColor }]} />

      {/* 吹き出し */}
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{place.name}</Text>
          <Text style={styles.calloutCategory}>
            {CATEGORY_LABELS[place.category]}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  pinContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  pinEmoji: {
    fontSize: 18,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
  callout: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  calloutTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  calloutCategory: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
