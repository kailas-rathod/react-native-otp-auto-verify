import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useOtpVerification } from 'react-native-otp-auto-verify';

const OTP_LENGTH = 6;

function OtpVerifyScreen() {
  const {
    hashCode,
    otp,
    sms,
    timeoutError,
    startListening,
    stopListening,
  } = useOtpVerification({ numberOfDigits: OTP_LENGTH });

  const [manualOtp, setManualOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStart = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await startListening();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to start OTP listener'
      );
    } finally {
      setLoading(false);
    }
  }, [startListening]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>OTP Auto-Verify</Text>
        <Text style={styles.subtitle}>
          Uses Google SMS Retriever API (no READ_SMS permission)
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Start OTP listener</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={stopListening}
        >
          <Text style={styles.buttonTextSecondary}>Stop listening</Text>
        </TouchableOpacity>

        {timeoutError && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Listener timed out (5 min). Tap &quot;Start OTP listener&quot; to
              try again.
            </Text>
          </View>
        )}

        {hashCode ? (
          <View style={styles.infoBox}>
            <Text style={styles.label}>App hash (add to your SMS):</Text>
            <Text style={styles.hashCodeText} selectable>
              {hashCode}
            </Text>
          </View>
        ) : null}

        {sms && (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Last SMS:</Text>
            <Text style={styles.smsText} selectable>
              {sms}
            </Text>
          </View>
        )}

        {otp && (
          <View style={styles.otpBox}>
            <Text style={styles.label}>Detected OTP:</Text>
            <Text style={styles.otpValue}>{otp}</Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.label}>Or enter OTP manually:</Text>
          <TextInput
            style={styles.input}
            value={manualOtp}
            onChangeText={setManualOtp}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <OtpVerifyScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  hashCodeText: {
    fontSize: 13,
    color: '#333',
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
  },
  smsText: {
    fontSize: 13,
    color: '#333',
  },
  otpBox: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  otpValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2e7d32',
    letterSpacing: 4,
  },
  inputSection: {
    marginTop: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    letterSpacing: 4,
  },
});
