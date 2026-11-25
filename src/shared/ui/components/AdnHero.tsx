import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

const logoAdn = require('@/assets/logoADN.png');

interface AdnHeroProps {
  patternId: string;
  variant?: 'subpage' | 'home';
  onBack?: () => void;
  onLogout?: () => void;
  rightExtra?: ReactNode;
  paddingBottom?: number;
  children?: ReactNode;
}

export function AdnHero({
  patternId,
  variant = 'subpage',
  onBack,
  onLogout,
  rightExtra,
  paddingBottom,
  children,
}: AdnHeroProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isHome = variant === 'home';

  return (
    <LinearGradient
      colors={[Colors.primaryMedium, Colors.primaryMedium, Colors.primaryMedium]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        isHome ? styles.heroHome : styles.heroSubpage,
        paddingBottom !== undefined ? { paddingBottom } : null,
      ]}
    >
      <View style={[styles.heroGrid, { width: screenWidth }]} pointerEvents="none">
        <Svg width={screenWidth} height={460}>
          <Defs>
            <Pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
              <Path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke={Colors.primary}
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
            </Pattern>
          </Defs>
          <Rect width={screenWidth} height={460} fill={`url(#${patternId})`} />
        </Svg>
      </View>

      {isHome ? (
        <View style={styles.topBarHome}>
          <Image source={logoAdn} style={styles.logoHome} contentFit="contain" />
          <View style={styles.topActions}>
            {rightExtra}
            {onLogout ? (
              <TouchableOpacity
                onPress={onLogout}
                activeOpacity={0.75}
                style={styles.logoutChip}
                accessibilityLabel="Cerrar sesión"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.topBarSubpage}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={styles.backChip}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M11 6l-6 6 6 6"
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.backChipText}>Volver</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Image source={logoAdn} style={styles.logoSubpage} contentFit="contain" />
        </View>
      )}

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
  },
  heroHome: {
    paddingTop: 25,
    paddingBottom: 28,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroSubpage: {
    paddingTop: 28,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBarHome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  topBarSubpage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logoHome: {
    width: 122,
    height: 65,
  },
  logoSubpage: {
    width: 88,
    height: 54,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    top: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    top: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  backChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
