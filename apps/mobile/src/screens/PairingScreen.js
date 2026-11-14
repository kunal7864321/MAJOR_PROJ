import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiRequest, configureApi } from '../services/api';

export default function PairingScreen({ onPaired, onCancel }) {
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('Android Mobile');
  const [serverUrl, setServerUrl] = useState(
    process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api'
  );
  const [loading, setLoading] = useState(false);

  const handleManualPair = async () => {
    const apiUrl = serverUrl.trim().replace(/\/+$/, '');
    if (!code.trim() || !deviceName.trim() || !apiUrl) {
      Alert.alert('Required', 'Enter a pairing code, device name, and server URL');
      return;
    }
    setLoading(true);
    try {
      let pairingCode = code.trim();
      let resolvedUrl = apiUrl;
      if (pairingCode.startsWith('{')) {
        const payload = JSON.parse(pairingCode);
        if (!payload.code) throw new Error('QR data does not contain a pairing code');
        pairingCode = payload.code;
        resolvedUrl = payload.serverUrl || apiUrl;
        setServerUrl(resolvedUrl);
      }

      configureApi(null, resolvedUrl);
      const data = await apiRequest('/pairings/consume', {
        method: 'POST',
        body: JSON.stringify({ code: pairingCode, deviceName: deviceName.trim(), platform: 'android' })
      });
      Alert.alert('Success', 'Device paired successfully!');
      onPaired(data.token, resolvedUrl);
    } catch (err) {
      Alert.alert('Pairing Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pair with Desktop</Text>
      <Text style={styles.desc}>Enter the pairing code or paste the QR contents from your desktop.</Text>
      <TextInput
        style={styles.input}
        placeholder="Server URL"
        value={serverUrl}
        onChangeText={setServerUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <TextInput
        style={styles.input}
        placeholder="Device name"
        value={deviceName}
        onChangeText={setDeviceName}
      />
      <TextInput
        style={styles.input}
        placeholder="32-character code or QR contents"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.btn} onPress={handleManualPair} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Pairing...' : 'Confirm Pairing'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
        <Text style={styles.cancelText}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#64748b', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, marginBottom: 16 },
  btn: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText: { color: '#2563eb' }
});
