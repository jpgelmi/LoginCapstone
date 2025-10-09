import authService from './AuthService';
import axios from 'axios';

const BASE_URL = 'https://e0as.me';

// Interfaces para tipos de datos
export interface Form {
  _id: string;
  title: string;
  formType: 'injury' | 'wellness' | 'training-load' | string;
  status: 'published' | 'draft';
  createdAt?: string;
}

export interface FormQuestion {
  _id: string;
  enunciado: string;
  tipo: 'texto' | 'numero' | 'opcionMultiple' | 'escala';
  requerida: boolean;
  orden: number;
  opciones?: string[];
  escalaMin?: number;
  escalaMax?: number;
  userAnswer?: any;
}

export interface FormResponse {
  _id: string;
  formId: string;
  userId: string;
  status: 'draft' | 'submitted' | 'validated';
  responses: Array<{
    questionId: string;
    answer: any;
  }>;
  questions?: FormQuestion[];
  submittedAt?: string;
  validatedAt?: string;
}

export interface FormResponsesFilter {
  formType?: 'injury' | 'wellness' | 'training-load' | string;
  status?: 'draft' | 'submitted' | 'validated';
}

class FormResponseService {
  
  

  /**
   * Obtener header con cookie de sesión
   */
  private async getHeaders(): Promise<{ [key: string]: string }> {
    const sessionCookie = await authService.extractSessionCookie();
    if (!sessionCookie) {
      throw new Error('No se pudo obtener la sesión de autenticación');
    }
    
    return {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Obtener todos los formularios disponibles
   * GET /forms
   */
  async getForms(): Promise<Form[]> {
    try {
      console.log('[FETCH] FormResponseService: Obteniendo formularios disponibles...');
      
      const response = await axios.get(`${BASE_URL}/forms`);
      
      console.log('[SUCCESS] FormResponseService: Formularios obtenidos:', response.data.data?.length);
      
      return response.data.data || [];
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error obteniendo formularios:', error);
      throw error;
    }
  }

  /**
   * Auto-asignar un formulario al usuario actual
   * POST /athletes/me/form-responses/assign
   */
  async assignFormToMe(formId: string, questionsToAsk: string[] = []): Promise<FormResponse> {
    try {
      console.log('[ASSIGN] FormResponseService: Auto-asignando formulario:', formId);
      
      const response = await axios.post(`${BASE_URL}/athletes/me/form-responses/assign`, {
        formId,
        questionsToAsk
      });

      console.log('[SUCCESS] FormResponseService: Formulario auto-asignado:', response.data.data._id);
      
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error auto-asignando formulario:', error);
      throw error;
    }
  }

  /**
   * Obtener las preguntas de un formulario específico
   * GET /form-responses/form/{formResponseId}
   */
  async getFormQuestions(formResponseId: string): Promise<FormResponse> {
    try {
      console.log('[FETCH] FormResponseService: Obteniendo preguntas del formulario:', formResponseId);
      
      const response = await axios.get(`${BASE_URL}/form-responses/form/${formResponseId}`);
      
      console.log('[SUCCESS] FormResponseService: Preguntas obtenidas:', response.data.data.questions?.length);
      
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error obteniendo preguntas:', error);
      throw error;
    }
  }

  /**
   * Guardar respuestas del formulario (como borrador)
   * POST /form-responses
   */
  async saveFormResponses(
    formId: string,
    formResponseId: string,
    responses: Array<{ questionId: string; answer: any }>,
    status: 'draft' | 'submitted' = 'draft'
  ): Promise<FormResponse> {
    try {
      console.log('[SAVE] FormResponseService: Guardando respuestas como:', status);
      
      const body = {
        formId,
        formResponseId,
        status,
        responses
      };

      const response = await axios.post(`${BASE_URL}/form-responses`, body);
      
      console.log('[SUCCESS] FormResponseService: Respuestas guardadas correctamente');
      
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error guardando respuestas:', error);
      throw error;
    }
  }

  /**
   * Enviar formulario completado
   * PATCH /form-responses/response/{formResponseId}/submit
   */
  async submitForm(formResponseId: string): Promise<FormResponse> {
    try {
      console.log('[SUBMIT] FormResponseService: Enviando formulario:', formResponseId);
      
      const response = await axios.patch(`${BASE_URL}/form-responses/response/${formResponseId}/submit`);
      
      console.log('[SUCCESS] FormResponseService: Formulario enviado exitosamente');
      
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error enviando formulario:', error);
      throw error;
    }
  }

  /**
   * Obtener mis propias respuestas con filtros opcionales
   * GET /form-responses/me
   */
  async getMyResponses(filters?: FormResponsesFilter): Promise<FormResponse[]> {
    try {
      console.log('[FETCH] FormResponseService: Obteniendo mis respuestas con filtros:', filters);
      
      // Construir query string con filtros
      const queryParams = new URLSearchParams();
      if (filters?.formType) {
        queryParams.append('formType', filters.formType);
      }
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }
      
      const queryString = queryParams.toString();
      const url = `/form-responses/me${queryString ? `?${queryString}` : ''}`;
      
      console.log('[REQUEST] FormResponseService: URL completa a llamar:', `${BASE_URL}${url}`);
      console.log('[REQUEST] FormResponseService: Método: GET');
      console.log('[REQUEST] FormResponseService: Query params:', queryString || 'ninguno');
      
      const response = await axios.get(url);

      console.log('[RESPONSE] FormResponseService: Respuesta recibida - Status:', response.status);
      console.log('[SUCCESS] FormResponseService: Respuestas obtenidas:', response.data.data?.length);
      
      return response.data.data || [];
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error obteniendo respuestas:', error);
      throw error;
    }
  }

  /**
   * Obtener mis respuestas por tipo de formulario
   * GET /form-responses/me/type/{formType}
   */
  async getMyResponsesByType(formType: 'injury' | 'wellness' | 'training-load'): Promise<FormResponse[]> {
    try {
      console.log('[FETCH] FormResponseService: Obteniendo respuestas por tipo:', formType);
      
      const response = await axios.get(`${BASE_URL}/form-responses/me/type/${formType}`);
      
      console.log('[SUCCESS] FormResponseService: Respuestas por tipo obtenidas:', response.data.data?.length);
      
      return response.data.data || [];
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error obteniendo respuestas por tipo:', error);
      throw error;
    }
  }

  /**
   * Flujo completo: obtener o crear respuesta de formulario
   * Verifica si ya existe una respuesta, si no, auto-asigna el formulario
   */
  async getOrCreateFormResponse(formId: string): Promise<{ formResponse: FormResponse; isNew: boolean }> {
    try {
      console.log('[FLOW] FormResponseService: Iniciando flujo completo para formId:', formId);
      console.log('[FLOW] FormResponseService: Timestamp:', new Date().toLocaleTimeString());
      
      // Primero intentar obtener respuestas existentes
      console.log('[FLOW] FormResponseService: PASO 1 - Verificando respuestas existentes...');
      console.log('[FLOW] FormResponseService: Llamando a getMyResponses() - esto hará GET /form-responses/me');
      
      const myResponses = await this.getMyResponses();
      
      console.log('[FLOW] FormResponseService: Respuestas existentes obtenidas:', myResponses.length);
      
      // Buscar si ya existe una respuesta para este formulario
      const existingResponse = myResponses.find(response => 
        response.formId === formId || 
        (typeof response.formId === 'object' && (response.formId as any)._id === formId)
      );
      
      if (existingResponse) {
        console.log('[FLOW] FormResponseService: Respuesta existente encontrada:', existingResponse._id);
        console.log('[FLOW] FormResponseService: PASO 2A - Obteniendo preguntas de respuesta existente...');
        // Obtener las preguntas de la respuesta existente
        const fullResponse = await this.getFormQuestions(existingResponse._id);
        return { formResponse: fullResponse, isNew: false };
      }
      
      // Si no existe, auto-asignar el formulario
      console.log('[FLOW] FormResponseService: No hay respuesta existente');
      console.log('[FLOW] FormResponseService: PASO 2B - Creando nueva respuesta para formulario:', formId);
      const newResponse = await this.assignFormToMe(formId);
      
      // Obtener las preguntas de la nueva respuesta
      console.log('[FLOW] FormResponseService: PASO 3 - Obteniendo preguntas de nueva respuesta...');
      const fullResponse = await this.getFormQuestions(newResponse._id);
      return { formResponse: fullResponse, isNew: true };
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error en flujo completo:', error);
      console.error('[ERROR] FormResponseService: Stack trace completo:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }
}

// Instancia singleton
const formResponseService = new FormResponseService();

export default formResponseService;