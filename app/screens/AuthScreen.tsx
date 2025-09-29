'use client';

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
  const { login, sendOTP } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [dob, setDob] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [loading, setLoading] = useState(false);

 const handleSendOTP = async () => {
  try {
    const result = await sendOTP(phone);
    console.log("OTP sent:", result);
  } catch (err) {
    console.error("Error sending OTP:", err);
    Alert.alert("Error", "Could not send OTP. Please try again.");
  }
};


  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }
    setLoading(true);
    try {
      await login(phone, otp);
      setStep('profile'); // move to profile setup
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!gender || !dob) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await login(phone, otp, gender, dob);
      Alert.alert('Success', 'Profile completed!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Icon name="call" size={50} color="#007AFF" />
          <Text style={styles.title}>Social Calling</Text>
          <Text style={styles.subtitle}>Connect with people worldwide</Text>
        </View>

        <View style={styles.formContainer}>
          {step === 'phone' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter Your Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={styles.demoText}>Demo OTP: 123456</Text>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('phone')}>
                <Text style={styles.backButtonText}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'profile' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Complete Your Profile</Text>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {['male', 'female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                    onPress={() => setGender(g as 'male' | 'female')}
                  >
                    <Text style={gender === g ? styles.genderTextSelected : styles.genderText}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={dob}
                onChangeText={setDob}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCompleteProfile}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#007AFF', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  formContainer: { width: '100%' },
  stepContainer: { width: '100%' },
  stepTitle: { fontSize: 24, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  genderButton: { flex: 1, padding: 15, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 5, alignItems: 'center' },
  genderButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  genderText: { color: '#333', fontWeight: '600' },
  genderTextSelected: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButtonText: { color: '#007AFF', fontSize: 16, textAlign: 'center', marginTop: 10 },
  demoText: { textAlign: 'center', color: '#666', marginBottom: 15, fontStyle: 'italic' },
});

export default AuthScreen;
