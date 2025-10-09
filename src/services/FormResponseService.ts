import authService from './AuthService';

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
   * Función de prueba para diferentes formatos de cookie
   */
  private async testCookieFormats(originalCookie: string): Promise<string | null> {
    console.log('[TEST] FormResponseService: testCookieFormats - Cookie original:', originalCookie);
    
    // Extraer solo el valor de la cookie (la parte después del =)
    const cookieValue = originalCookie.includes('=') ? originalCookie.split('=')[1] : originalCookie;
    console.log('[TEST] FormResponseService: Valor extraído de la cookie:', cookieValue);
    
    // Diferentes formatos a probar
    const formatosAPorbar = [
      `_Host-sid=${cookieValue}`,     // Una sola barra baja (sugerencia del usuario)
      `Host-sid=${cookieValue}`,      // Sin barras bajas
      `sid=${cookieValue}`,           // Solo 'sid'
      `session=${cookieValue}`,       // 'session' simple
      cookieValue,                    // Solo el valor
    ];
    
    console.log('[TEST] FormResponseService: Probando formatos:', formatosAPorbar);
    
    // Probar cada formato
    for (let i = 0; i < formatosAPorbar.length; i++) {
      const formato = formatosAPorbar[i];
      console.log(`[TEST] FormResponseService: Probando formato ${i + 1}/${formatosAPorbar.length}: ${formato}`);
      
      try {
        const testResponse = await fetch(`${BASE_URL}/form-responses/me`, {
          method: 'GET',
          headers: {
            'Cookie': formato,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`   Status: ${testResponse.status}`);
        
        if (testResponse.ok) {
          console.log('[SUCCESS] FormResponseService: Formato exitoso encontrado:', formato);
          return formato;
        }
      } catch (error) {
        console.log(`   Error con formato: ${error}`);
      }
    }
    
    console.log('[ERROR] FormResponseService: Ningún formato de cookie funcionó');
    return null;
  }

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
      
      const headers = await this.getHeaders();
      const response = await fetch(`${BASE_URL}/forms`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error obteniendo formularios: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Formularios obtenidos:', data.data?.length);
      
      return data.data || [];
    } catch (error) {
      console.error('[ERROR] FormResponseService: Error obteniendo formularios:', error);
      throw error;
    }
  }

  /**
   * Auto-asignar un formulario al usuario actual
   * POST /form-responses/assign/me
   */
  async assignFormToMe(formId: string, questionsToAsk: string[] = []): Promise<FormResponse> {
    try {
      console.log('[ASSIGN] FormResponseService: Auto-asignando formulario:', formId);
      
      const headers = await this.getHeaders();
      const body = {
        formId,
        questionsToAsk
      };

      const response = await fetch(`${BASE_URL}/form-responses/assign/me`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error auto-asignando formulario: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Formulario auto-asignado:', data.data._id);
      
      return data.data;
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
      
      const headers = await this.getHeaders();
      const response = await fetch(`${BASE_URL}/form-responses/form/${formResponseId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error obteniendo preguntas: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Preguntas obtenidas:', data.data.questions?.length);
      
      return data.data;
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
      
      const headers = await this.getHeaders();
      const body = {
        formId,
        formResponseId,
        status,
        responses
      };

      const response = await fetch(`${BASE_URL}/form-responses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error guardando respuestas: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Respuestas guardadas correctamente');
      
      return data.data;
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
      
      const headers = await this.getHeaders();
      const response = await fetch(`${BASE_URL}/form-responses/response/${formResponseId}/submit`, {
        method: 'PATCH',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error enviando formulario: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Formulario enviado exitosamente');
      
      return data.data;
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
      
      const headers = await this.getHeaders();
      console.log('[AUTH] FormResponseService: Headers preparados:', {
        hasAuth: !!headers.Cookie,
        contentType: headers['Content-Type']
      });
      
      // Construir query string con filtros
      const queryParams = new URLSearchParams();
      if (filters?.formType) {
        queryParams.append('formType', filters.formType);
      }
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/form-responses/me${queryString ? `?${queryString}` : ''}`;
      
      console.log('[REQUEST] FormResponseService: URL completa a llamar:', url);
      console.log('[REQUEST] FormResponseService: Método: GET');
      console.log('[REQUEST] FormResponseService: Query params:', queryString || 'ninguno');
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('[RESPONSE] FormResponseService: Respuesta recibida - Status:', response.status);
      console.log('[RESPONSE] FormResponseService: Respuesta recibida - StatusText:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ERROR] FormResponseService: ERROR DETALLADO:');
        console.error('   URL que falló:', url);
        console.error('   Status Code:', response.status);
        console.error('   Status Text:', response.statusText);
        console.error('   Error Body:', errorText);
        console.error('   Headers enviados:', JSON.stringify(headers, null, 2));
        
        // Si es error 403, probar diferentes formatos de cookie
        if (response.status === 403) {
          console.log('[TEST] FormResponseService: Error 403 detectado, probando diferentes formatos de cookie...');
          const workingCookieFormat = await this.testCookieFormats(headers.Cookie);
          
          if (workingCookieFormat) {
            console.log('[SUCCESS] FormResponseService: Formato de cookie correcto encontrado! Reintentando...');
            // Reintentar con el formato correcto
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'Cookie': workingCookieFormat,
                'Content-Type': 'application/json',
              },
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log('[SUCCESS] FormResponseService: Éxito con formato corregido!');
              return retryData.data || [];
            }
          }
        }
        
        throw new Error(`Error obteniendo respuestas: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Respuestas obtenidas:', data.data?.length);
      
      return data.data || [];
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
      
      const headers = await this.getHeaders();
      const response = await fetch(`${BASE_URL}/form-responses/me/type/${formType}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error obteniendo respuestas por tipo: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[SUCCESS] FormResponseService: Respuestas por tipo obtenidas:', data.data?.length);
      
      return data.data || [];
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