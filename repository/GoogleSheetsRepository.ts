import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, Appointment } from 'models/types';

export const CONFIG_KEYS = {
  WEB_APP_URL: '@clinic:config:webAppUrl',
};

// Хардкодимо токен, щоб прибрати його з UI. Це внутрішній секрет між додатком і GAS.
const API_TOKEN = 'clinic_secret_2026';

export class GoogleSheetsRepository {
  private async getUrl(): Promise<string> {
    const url = await AsyncStorage.getItem(CONFIG_KEYS.WEB_APP_URL);
    if (!url) {
      throw new Error('Google Apps Script URL is not configured in Settings.');
    }
    return url;
  }

  private async request(action: string, data?: unknown) {
    const url = await this.getUrl();

    const requestPayload = { action, token: API_TOKEN, data };
    console.log(`[GoogleSheetsRepository] Sending ${action} to Apps Script...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const json = await response.json();

      if (json.status !== 'success') {
        console.error(`[GoogleSheetsRepository] Error from Apps Script:`, json.message);
        throw new Error(json.message || 'Error from Google Apps Script');
      }

      console.log(`[GoogleSheetsRepository] Success response for ${action}`);
      return json;
    } catch (error) {
      console.error(`[GoogleSheetsRepository] Request failed:`, error);
      throw error;
    }
  }

  // --- API METHODS ---

  async ping(): Promise<boolean> {
    try {
      const res = await this.request('ping');
      return res.status === 'success';
    } catch {
      return false;
    }
  }

  // Об'єднаний метод для економії HTTP запитів
  async getAllData(): Promise<{ patients: Patient[]; appointments: Appointment[] }> {
    const res = await this.request('getAllData');
    return {
      patients: res.patients || [],
      appointments: res.appointments || [],
    };
  }

  async savePatient(patient: Patient): Promise<void> {
    await this.request('savePatient', patient);
  }

  async saveAppointment(appointment: Appointment): Promise<void> {
    await this.request('saveAppointment', appointment);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.request('deleteAppointment', { id });
  }
  async deletePatient(id: string): Promise<void> {
    await this.request('deletePatient', { id });
  }
}
