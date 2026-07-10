# Ezploro 🌟

Ezploro is a comprehensive event management and social networking mobile application built with React Native and Expo. The app allows users to discover, create, and manage events while connecting with other users in their community.

## Features

- 🎉 **Event Management**: Create, discover, and manage events
- 👥 **Social Networking**: Connect with other users and build communities
- 📱 **Cross-Platform**: Available on both iOS and Android
- 🔔 **Push Notifications**: Real-time notifications for events and messages
- 📍 **Location Services**: Location-based event discovery
- 📸 **Media Support**: Photo and video sharing capabilities
- 🌐 **Multi-language Support**: Internationalization with i18next
- 🔐 **Authentication**: Secure user authentication with Firebase

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation 7
- **State Management**: React Context API
- **Backend**: Firebase
- **Notifications**: Expo Notifications
- **Maps**: React Native Maps
- **UI Components**: React Native Paper, React Native Elements
- **Internationalization**: i18next

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd Ezploro
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server
   ```bash
   npx expo start
   ```

### Building the App

#### Development Build
```bash
npx expo run:android
npx expo run:ios
```

#### Production Build with EAS
```bash
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

## Project Structure

```
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # API services and utilities
├── assets/             # Images, fonts, and other assets
├── config/             # Configuration files
├── utils/              # Utility functions
└── App.js              # Main application component
```

## Recent Updates

### v1.0.0 - Build System Improvements
- ✅ **Fixed Android Build Issues**: Removed deprecated `expo-permissions` package
- 🔧 **Updated Dependencies**: Migrated to modern permission handling with `expo-notifications`
- 🚀 **EAS Build Integration**: Improved build reliability with EAS Build
- 📱 **New Architecture Support**: Compatible with React Native's new architecture
- 🔔 **Notification Service**: Enhanced notification system with proper permission handling

## Configuration

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
FIREBASE_CREDENTIALS_PATH=path/to/firebase/credentials
REACT_APP_API_URL=your_api_url
GOOGLE_MAPS_API_KEY=your_google_maps_key
# Add other required environment variables
```

### EAS Configuration
The project uses EAS Build for reliable builds. Configuration is available in `eas.json`:
- **Development**: Development client builds
- **Preview**: Internal distribution builds
- **Production**: Production builds for app stores

## Troubleshooting

### Build Issues
If you encounter build issues:
1. Clean the project: `npx expo prebuild --clean`
2. Use EAS Build: `npx eas build --platform android`
3. Check that all dependencies are compatible with Expo SDK 54

### Permission Issues
The app uses modern permission APIs:
- Notifications: `expo-notifications`
- Camera: `expo-camera`
- Location: `expo-location`
- Media Library: `expo-media-library`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
