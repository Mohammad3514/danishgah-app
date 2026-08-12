// Firebase Configuration
// Replace these with your actual Firebase project credentials
// Go to: https://console.firebase.google.com → Project Settings → Web App

export const firebaseConfig = {
  apiKey: "AIzaSyBOfOnVZcvtbI7Dh_NqdHhJVlEIeR-LMHM",
  authDomain: "danishgah-50f15.firebaseapp.com",
  projectId: "danishgah-50f15",
  storageBucket: "danishgah-50f15.firebasestorage.app",
  messagingSenderId: "825218187884",
  appId: "1:825218187884:web:de8e13c4c1695fefe0ce49"
};

// Supabase Configuration
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "https://jfbfdgkzkdpepluoewgi.supabase.co",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_P17TbCHoG6Few0bJEHjxLQ_E17Fd8UH"
};
