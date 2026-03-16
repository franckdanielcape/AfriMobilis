import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import VersementsScreen from './src/screens/VersementsScreen';
import PannesScreen from './src/screens/PannesScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation pour Chauffeur
function ChauffeurTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                },
            }}
        >
            <Tab.Screen 
                name="Accueil" 
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
                }}
            />
            <Tab.Screen 
                name="Versements" 
                component={VersementsScreen}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>,
                }}
            />
            <Tab.Screen 
                name="Pannes" 
                component={PannesScreen}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔧</Text>,
                }}
            />
            <Tab.Screen 
                name="Profil" 
                component={ProfilScreen}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
                }}
            />
        </Tab.Navigator>
    );
}

// Navigation principale
function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text>Chargement...</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={ChauffeurTabs} />
                    <Stack.Screen 
                        name="Notifications" 
                        component={NotificationsScreen}
                        options={{ headerShown: true, title: 'Notifications' }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                </NavigationContainer>
            </AuthProvider>
        </SafeAreaProvider>
    );
}

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
