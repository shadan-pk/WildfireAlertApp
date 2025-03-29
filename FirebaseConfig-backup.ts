// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { initializeAuth, getReactNativePersistence } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import * as SecureStore from "expo-secure-store";

// // Custom persistence adapter for Expo's SecureStore
// class ExpoSecureStorePersistence {
//   async setItem(key: string, value: string) {
//     await SecureStore.setItemAsync(key, value);
//   }

//   async getItem(key: string) {
//     return await SecureStore.getItemAsync(key);
//   }

//   async removeItem(key: string) {
//     await SecureStore.deleteItemAsync(key);
//   }
// }

// const firebaseConfig = {
//   apiKey: "AIzaSyCe5JcQ0XGWInrPuOujgczHRIDEhCmE4YI",
//   authDomain: "disasterchatbot-676af.firebaseapp.com",
//   projectId: "disasterchatbot-676af",
//   storageBucket: "disasterchatbot-676af.firebasestorage.app",
//   messagingSenderId: "183034924317",
//   appId: "1:183034924317:web:cd114ab7c65f98dc9e65f4",
//   measurementId: "G-VE49PXZ1TG"
// };

// // Initialize Firebase
// export const FIREBASE_APP = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(FIREBASE_APP);

// // Initialize Auth with Expo's SecureStore persistence
// export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
//   persistence: getReactNativePersistence(new ExpoSecureStorePersistence())
// });

// export const FIREBASE_DB = getFirestore(FIREBASE_APP);