import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login, sendOTP } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text>Phone:</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Button title="Send OTP" onPress={() => sendOTP(phone)} />

      <Text>OTP:</Text>
      <TextInput value={otp} onChangeText={setOtp} keyboardType="numeric" />
      <Button title="Login" onPress={() => login(phone, otp)} />
    </View>
  );
};

export default LoginScreen;
