import { Colors } from '@shared/ui/theme/colors';
import { useState } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';

interface AppInputProps<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label: string;
  errorMessage?: string;
}

export function AppInput<T extends FieldValues>({
  control,
  name,
  label,
  errorMessage,
  secureTextEntry,
  style,
  ...rest
}: AppInputProps<T>) {
  const [hidePassword, setHidePassword] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.inputWrapper, errorMessage ? styles.inputError : null]}>
            <TextInput
              style={[styles.input, style]}
              placeholderTextColor={Colors.textSecondary}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry={secureTextEntry ? hidePassword : false}
              {...rest}
            />
            {secureTextEntry ? (
              <TouchableOpacity
                onPress={() => setHidePassword((prev) => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.eyeButton}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  {hidePassword ? (
                    <SvgPath
                      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zm11 3a3 3 0 100-6 3 3 0 000 6z"
                      stroke={Colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <SvgPath
                      d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.77 21.77 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.8 21.8 0 01-2.69 3.66M1 1l22 22"
                      stroke={Colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    paddingLeft: 10,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    marginTop: 5,
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
  },
});
