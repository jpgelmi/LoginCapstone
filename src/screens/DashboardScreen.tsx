import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import TabBar from '../components/TabBar';

interface Tab {
  id: string;
  title: string;
  icon: string;
}

const DashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  // Definir las pestañas
  const tabs: Tab[] = [
    { id: 'home', title: 'Inicio', icon: '🏠' },
    { id: 'profile', title: 'Perfil', icon: '👤' },
  ];

  // Manejar cambio de pestaña
  const handleTabPress = (tabId: string) => {
    console.log(`📱 DashboardScreen: Cambiando a pestaña ${tabId}`);
    setActiveTab(tabId);
  };

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
  },
});

export default DashboardScreen;