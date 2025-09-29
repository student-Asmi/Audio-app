// types.ts
import { AuthProvider } from "../contexts/AuthContext";


export interface User {
  id: string;
  phone: string;
  gender: 'male' | 'female';
  date_of_birth: string;
  online: boolean;
  created_at: string;
}

export interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'calling' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
  started_at?: string;
  ended_at?: string;
  duration?: number;
  created_at: string;
  caller?: User;
  receiver?: User;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}


export default function App() {
  return (
    <AuthProvider>
      <Slot />  {/* Expo Router ke liye placeholder for nested routes */}
    </AuthProvider>
  );
}