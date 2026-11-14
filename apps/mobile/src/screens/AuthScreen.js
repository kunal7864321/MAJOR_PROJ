import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

export default function AuthScreen({ onLoginSuccess, onPairDevice }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [serverUrl, setServerUrl] = useState(
    process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api'
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const apiUrl = serverUrl.trim().replace(/\/+$/, '');
    if (!email.trim() || !password || (isRegister && !fullName.trim()) || !apiUrl) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister 
        ? { email: email.trim(), password, fullName: fullName.trim(), deviceName: 'Android Phone', platform: 'android' }
        : { email: email.trim(), password, deviceName: 'Android Phone', platform: 'android' };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Authentication failed');

      onLoginSuccess(data.token, apiUrl);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PocketBridge</Text>
      <Text style={styles.subtitle}>{isRegister ? 'Create an account' : 'Sign in to companion'}</Text>
      
      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Server URL (use your computer's LAN IP on a phone)"
        value={serverUrl}
        onChangeText={setServerUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Text style={styles.hint}>
        Android emulator default is 10.0.2.2. On a physical phone, enter your computer's Wi-Fi IP.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.toggleBtn}>
        <Text style={styles.toggleText}>{isRegister ? 'Already registered? Sign In' : 'Need an account? Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPairDevice} style={styles.toggleBtn}>
        <Text style={styles.toggleText}>Pair with an existing desktop</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  toggleBtn: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#2563eb', fontSize: 14 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 8 }
});
