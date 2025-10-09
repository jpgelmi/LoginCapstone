import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import authService from '../services/AuthService';

interface WellnessScreenProps {
  onBack: () => void;
}

interface WellnessData {
  sleepQuality: number;
  musclePain: number;
  fatigue: number;
  stress: number;
  notes: string;
}

const WellnessScreen: React.FC<WellnessScreenProps> = ({ onBack }) => {
  // Estados separados para cada slider para evitar interferencias
  const [sleepQuality, setSleepQuality] = useState(5);
  const [musclePain, setMusclePain] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [stress, setStress] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para obtener el color según el valor del slider
  const getColorForValue = useCallback((value: number): string => {
    if (value <= 3) return '#ef4444'; // Rojo para valores bajos
    if (value <= 6) return '#f59e0b'; // Amarillo para valores medios
    return '#10b981'; // Verde para valores altos
  }, []);

  // Función para obtener la descripción según el valor
  const getDescriptionForValue = useCallback((value: number): string => {
    if (value <= 2) return 'Muy Malo';
    if (value <= 4) return 'Malo';
    if (value <= 6) return 'Regular';
    if (value <= 8) return 'Bueno';
    return 'Excelente';
  }, []);

  // Handlers específicos para cada slider
  const handleSleepQualityChange = useCallback((value: number) => {
    setSleepQuality(value);
  }, []);

  const handleMusclePainChange = useCallback((value: number) => {
    setMusclePain(value);
  }, []);

  const handleFatigueChange = useCallback((value: number) => {
    setFatigue(value);
  }, []);

  const handleStressChange = useCallback((value: number) => {
    setStress(value);
  }, []);

  // Componente del slider personalizado
  const WellnessSlider: React.FC<{
    title: string;
    value: number;
    onValueChange: (value: number) => void;
    icon: string;
    isReversed?: boolean; // Para dolor muscular, fatiga y estrés (donde menos es mejor)
  }> = ({ title, value, onValueChange, icon, isReversed = false }) => {
    // Siempre mostrar el valor directo del slider (0-10)
    const color = getColorForValue(value);

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderIcon}>{icon}</Text>
          <View style={styles.sliderTitleContainer}>
            <Text style={styles.sliderTitle}>{title}</Text>
            <Text style={[styles.sliderValue, { color }]}>
              {Math.round(value)}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonControlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, value <= 0 && styles.controlButtonDisabled]}
            onPress={() => onValueChange(Math.max(0, value - 1))}
            disabled={value <= 0}
          >
            <Text style={[styles.controlButtonText, value <= 0 && styles.controlButtonTextDisabled]}>−</Text>
          </TouchableOpacity>
          
          <View style={styles.valueDisplay}>
            <Text style={[styles.valueText, { color }]}>{Math.round(value)}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.controlButton, value >= 10 && styles.controlButtonDisabled]}
            onPress={() => onValueChange(Math.min(10, value + 1))}
            disabled={value >= 10}
          >
            <Text style={[styles.controlButtonText, value >= 10 && styles.controlButtonTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>0</Text>
          <Text style={styles.sliderLabel}>10</Text>
        </View>
      </View>
    );
  };

  // Manejar envío de datos
  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevenir múltiples envíos
    
    setIsSubmitting(true);
    
    try {
      // Obtener la fecha actual en formato YYYY-MM-DD
      const today = new Date();
      const fecha = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');

      // Preparar el payload según el formato requerido
      const payload = {
        calidadSueno: Math.round(sleepQuality),
        dolorMuscular: Math.round(musclePain),
        fatiga: Math.round(fatigue),
        estres: Math.round(stress),
        notas: notes,
        fecha: fecha
      };
      
      console.log('💪 WellnessScreen: Enviando datos al endpoint:', payload);
      
      // Obtener la cookie de sesión
      const sessionCookie = await authService.extractSessionCookie();
      
      if (!sessionCookie) {
        throw new Error('No se pudo obtener la cookie de sesión');
      }

      // Realizar la petición POST
      const response = await fetch('https://e0as.me/wellness', {
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('🌐 WellnessScreen: Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        console.log('✅ WellnessScreen: Datos enviados exitosamente:', responseData);
        
        Alert.alert(
          '✅ Evaluación Guardada',
          `Tu evaluación de wellness ha sido registrada exitosamente:
          
🛏️ Calidad de Sueño: ${Math.round(sleepQuality)}/10
💪 Dolor Muscular: ${Math.round(musclePain)}/10
😴 Fatiga: ${Math.round(fatigue)}/10
😰 Estrés: ${Math.round(stress)}/10${notes ? `\n\n📝 Notas: ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}` : ''}`,
          [
            {
              text: 'OK',
              onPress: onBack,
            },
          ]
        );
      } else {
        // Intentar obtener el mensaje de error del servidor
        const errorData = await response.text().catch(() => '');
        console.error('❌ WellnessScreen: Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('💥 WellnessScreen: Error enviando datos:', error);
      
      Alert.alert(
        '❌ Error',
        `No se pudo enviar la evaluación de wellness. Por favor, verifica tu conexión e intenta nuevamente.\n\nError: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [
          {
            text: 'Reintentar',
            onPress: () => handleSubmit(),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Check</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Introducción */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>¿Cómo te sientes hoy?</Text>
          <Text style={styles.introSubtitle}>
            Evalúa tu estado actual en una escala del 0 al 10
          </Text>
        </View>

        {/* Sliders */}
        <View style={styles.slidersContainer}>
          <WellnessSlider
            title="Calidad de Sueño"
            value={sleepQuality}
            onValueChange={handleSleepQualityChange}
            icon="🛏️"
          />

          <WellnessSlider
            title="Dolor Muscular"
            value={musclePain}
            onValueChange={handleMusclePainChange}
            icon="💪"
            isReversed={true}
          />

          <WellnessSlider
            title="Nivel de Fatiga"
            value={fatigue}
            onValueChange={handleFatigueChange}
            icon="😴"
            isReversed={true}
          />

          <WellnessSlider
            title="Nivel de Estrés"
            value={stress}
            onValueChange={handleStressChange}
            icon="😰"
            isReversed={true}
          />
        </View>

        {/* Sección de Notas Adicionales */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>📝 Notas adicionales</Text>
          <Text style={styles.notesSubtitle}>
            Comparte cualquier detalle adicional sobre cómo te sientes hoy
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ej: Me siento bien en general, pero tuve un entrenamiento intenso ayer..."
            placeholderTextColor="#9ca3af"
            multiline={true}
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Botón de envío */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.loadingIndicator} />
                <Text style={styles.submitButtonText}>Enviando...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>💾 Guardar Evaluación</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },

  // Contenido
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  introContainer: {
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Sliders
  slidersContainer: {
    gap: 24,
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sliderTitleContainer: {
    flex: 1,
  },
  sliderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 60,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Controles de botones +/-
  buttonControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  controlButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  controlButtonTextDisabled: {
    color: '#9ca3af',
  },
  valueDisplay: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
  },

  // Botón de envío
  submitContainer: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  footerSpacer: {
    height: 24,
  },

  // Sección de notas
  notesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  notesSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  notesInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 100,
    fontFamily: 'System',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
});

export default WellnessScreen;