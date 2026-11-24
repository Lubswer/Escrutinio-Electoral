import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { z } from 'zod';

const loginBg = require('@/assets/images/fodoLogin.jpg');
const loginLottie = require('@/assets/animacionLogin.lottie');
const logoAdn = require('@/assets/logoADN.png');

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, isLoggingIn, loginError } = useAuth();
  const lottieRef = useRef<LottieView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // fr = 30 fps, op = 75 frames (2.5s). Reproduce hasta el segundo 1 (frame 30) y pausa ahí.
  useEffect(() => {
    lottieRef.current?.play(0, 10);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handlePressLogin = () => {
    lottieRef.current?.play(10, 75);
    void handleSubmit(onSubmit)();
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
    } catch {
      // El error se muestra en el banner inline vía loginError
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image
        source={loginBg}
        style={styles.bgImage}
        contentFit="cover"
        contentPosition="bottom"
      />

      <View style={styles.lottieLayer} pointerEvents="none">
        <LottieView
          ref={lottieRef}
          source={loginLottie}
          autoPlay={false}
          loop={false}
          speed={2}
          resizeMode="contain"
          style={styles.lottieFill}
        />
      </View>

      <LinearGradient
        colors={[
          Colors.primary,
          `${Colors.primary}B3`,
          `${Colors.primaryMedium}4D`,
          `${Colors.primary}00`,
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        dither
        style={styles.topGradient}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View entering={SlideInDown.duration(450)} style={styles.card}>
          <Text style={styles.badge}>PICHINCHA · RUMIÑAHUI</Text>
          <Text style={styles.title}>Control Electoral</Text>
          {loginError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{loginError}</Text>
            </View>
          ) : null}

          <AppInput
            control={control}
            name="email"
            label="Correo electrónico"
            placeholder="tucorreo@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            errorMessage={errors.email?.message}
          />

          <AppInput
            control={control}
            name="password"
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            errorMessage={errors.password?.message}
          />

          <AppButton
            title="Ingresar"
            onPress={handlePressLogin}
            loading={isLoggingIn}
            style={styles.submitButton}
          />

          <Link href={'/(auth)/forgot-password' as Href} style={styles.forgotLink}>
            ¿Olvidaste tu contraseña? Recupérala aquí
          </Link>
        </Animated.View>
      </ScrollView>

      {!keyboardVisible ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.logoContainer}
          pointerEvents="none"
        >
          <Image source={logoAdn} style={styles.logoAdn} contentFit="contain" />
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  bgImage: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    width: '100%',
    height: '60%',
  },
  lottieLayer: {
    position: 'absolute',
    top: 90,
    left: 50,
    right: 0,
    width: '70%',
    height: '50%',
  },
  lottieFill: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  logoContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  logoAdn: {
    width: 140,
    height: 85,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 22,
    lineHeight: 21,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 6,
  },
  forgotLink: {
    marginTop: 18,
    textAlign: 'center',
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
