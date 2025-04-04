# Wildfire Alert App

A React Native mobile application designed to provide real-time wildfire risk alerts to users based on temperature, humidity, and location data. Stay informed and safe with instant notifications and predictive insights.
>This app is part of the [AI-based Wildfire Alert System](https://github.com/shadan-pk/AI-based-Wildfire-Alert-System.git) a comprehensive wildfire prediction and alert solution.
---

## 🚀 Features

- 📱 User-friendly mobile interface built with React Native  
- 📍 Live location tracking sent to the server for personalized alerts  
- 🔔 Instant push notifications for high-risk wildfire zones  
- 🌡️ Real-time display of temperature and humidity data  
- 🔐 Secure user authentication via Firebase  

---

## 🧠 Tech Stack

- **Framework**: React Native  
- **Authentication**: Firebase Authentication  
- **Backend Integration**: Communicates with a Node.js + Express server  
- **Data Source**: Simulated server data and predictive alerts from LightGBM model  

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)  
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)  
- [React Native Expo](https://docs.expo.dev/)
- [Android Studio](https://developer.android.com/studio) (for Android)
- A Firebase project set up (for authentication)  

---

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shadan-pk/WildfireAlertApp.git
   cd WildfireAlertApp
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3.Set up Firebase:
- Create a Firebase project at console.firebase.google.com.
- Enable Authentication (e.g., Email/Password or Google Sign-In).
- Download the google-services.json (Android) or GoogleService-Info.plist (iOS) file and place it in the appropriate directory (see Firebase docs).
- Update the Firebase configuration in the app (e.g., in a firebaseConfig.js file).

3. **Intall EXPO GO app on android**
4. **Start EXPO Server**
   ```bash
   npx expo start
   ```
5.**scan the QR Code**

## 📡 Backend Integration

The app connects to a backend server (Node.js + Express) for:

- Sending live user location data  
- Receiving real-time temperature, humidity, and wildfire risk predictions  

Ensure the backend server is running and the API endpoint is configured in the app (e.g., update the base URL in your API client).

## License

MIT License

Copyright (c) 2025 Shadan PK

Permission is hereby granted, free of charge [LICENSE](LICENSE)
