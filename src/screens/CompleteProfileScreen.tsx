import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  secondLastName: string;
  rut: string;
  phone: string;
  birthDate: string;
  biologicalSex: 'masculino' | 'femenino' | '';
  insuranceType: string;
  establishment: string;
  sportDiscipline: string;
  professionalAspiration: boolean;
  career: string;
  competitiveLevel: string;
  universityEntryYear: string;
  projectedGraduationYear: string;
}

const CompleteProfileScreen: React.FC = () => {
  const { user, completeProfile, loading } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    secondLastName: '',
    rut: '',
    phone: '',
    birthDate: '',
    biologicalSex: '',
    insuranceType: 'FONASA',
    establishment: 'PUC',
    sportDiscipline: '',
    professionalAspiration: false,
    career: '',
    competitiveLevel: '',
    universityEntryYear: '',
    projectedGraduationYear: '',
  });

  // Actualizar campo del formulario
  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const requiredFields = [
      'firstName', 'lastName', 'rut', 'phone', 'birthDate', 
      'biologicalSex', 'sportDiscipline', 'career', 'competitiveLevel',
      'universityEntryYear', 'projectedGraduationYear'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof ProfileFormData]) {
        Alert.alert('Error', `El campo ${field} es obligatorio`);
        return false;
      }
    }

    // Validar formato de RUT (básico)
    if (!/^\d{7,8}-[\dkK]$/.test(formData.rut)) {
      Alert.alert('Error', 'El RUT debe tener el formato 12345678-9');
      return false;
    }

    // Validar formato de teléfono
    if (!/^\+569\d{8}$/.test(formData.phone)) {
      Alert.alert('Error', 'El teléfono debe tener el formato +56912345678');
      return false;
    }

    // Validar fecha de nacimiento (formato YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) {
      Alert.alert('Error', 'La fecha debe tener el formato YYYY-MM-DD');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.email) {
      Alert.alert('Error', 'No se encontró el email del usuario');
      return;
    }

    try {
      const profileData = {
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        secondLastName: formData.secondLastName || undefined,
        rut: formData.rut,
        phone: formData.phone,
        role: 'athlete' as const,
        athleteData: {
          birthDate: formData.birthDate,
          biologicalSex: formData.biologicalSex,
          insurance: { type: formData.insuranceType },
          establishment: formData.establishment,
          sportDiscipline: formData.sportDiscipline,
          professionalAspiration: formData.professionalAspiration,
          otherSports: [],
          pucData: {
            career: formData.career,
            competitiveLevel: formData.competitiveLevel,
            universityEntryYear: parseInt(formData.universityEntryYear),
            projectedGraduationYear: parseInt(formData.projectedGraduationYear),
          }
        }
      };

      const result = await completeProfile(profileData);

      if (result.success) {
        Alert.alert(
          'Perfil Completado',
          'Tu perfil ha sido creado exitosamente. Recibirás un email de bienvenida.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Error completando el perfil');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error inesperado');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Completar Perfil</Text>
          <Text style={styles.subtitle}>
            Completa tu información para finalizar el registro
          </Text>
        </View>

        <View style={styles.form}>
          {/* Información Personal */}
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre *"
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido Paterno *"
            value={formData.lastName}
            onChangeText={(value) => updateField('lastName', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido Materno"
            value={formData.secondLastName}
            onChangeText={(value) => updateField('secondLastName', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="RUT (12345678-9) *"
            value={formData.rut}
            onChangeText={(value) => updateField('rut', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono (+56912345678) *"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Fecha de Nacimiento (YYYY-MM-DD) *"
            value={formData.birthDate}
            onChangeText={(value) => updateField('birthDate', value)}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Sexo Biológico *</Text>
            <Picker
              selectedValue={formData.biologicalSex}
              onValueChange={(value: string) => updateField('biologicalSex', value)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar..." value="" />
              <Picker.Item label="Masculino" value="masculino" />
              <Picker.Item label="Femenino" value="femenino" />
            </Picker>
          </View>

          {/* Información de Salud */}
          <Text style={styles.sectionTitle}>Información de Salud</Text>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Seguro de Salud *</Text>
            <Picker
              selectedValue={formData.insuranceType}
              onValueChange={(value: string) => updateField('insuranceType', value)}
              style={styles.picker}
            >
              <Picker.Item label="FONASA" value="FONASA" />
              <Picker.Item label="ISAPRE" value="ISAPRE" />
              <Picker.Item label="Otro" value="OTRO" />
            </Picker>
          </View>

          {/* Información Deportiva */}
          <Text style={styles.sectionTitle}>Información Deportiva</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Disciplina Deportiva *"
            value={formData.sportDiscipline}
            onChangeText={(value) => updateField('sportDiscipline', value)}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Aspiración Profesional</Text>
            <Switch
              value={formData.professionalAspiration}
              onValueChange={(value) => updateField('professionalAspiration', value)}
            />
          </View>

          {/* Información Universitaria */}
          <Text style={styles.sectionTitle}>Información Universitaria</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Carrera *"
            value={formData.career}
            onChangeText={(value) => updateField('career', value)}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Nivel Competitivo *</Text>
            <Picker
              selectedValue={formData.competitiveLevel}
              onValueChange={(value: string) => updateField('competitiveLevel', value)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar..." value="" />
              <Picker.Item label="Seleccionado UC" value="seleccionado_uc" />
              <Picker.Item label="Elite" value="elite" />
              <Picker.Item label="Competitivo" value="competitivo" />
              <Picker.Item label="Recreativo" value="recreativo" />
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Año de Ingreso a la Universidad *"
            value={formData.universityEntryYear}
            onChangeText={(value) => updateField('universityEntryYear', value)}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Año Proyectado de Graduación *"
            value={formData.projectedGraduationYear}
            onChangeText={(value) => updateField('projectedGraduationYear', value)}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Completando Perfil...' : 'Completar Perfil'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#24292E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#586069',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292E',
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 8,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#586069',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#24292E',
  },
  submitButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CompleteProfileScreen;