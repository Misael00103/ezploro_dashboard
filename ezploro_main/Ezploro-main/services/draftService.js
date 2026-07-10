import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFTS_KEY = 'event_drafts';

class DraftService {
  /**
   * Guardar borrador de evento
   */
  async saveDraft(draftData) {
    try {
      const drafts = await this.getDrafts();
      const draftId = draftData.id || Date.now().toString();
      
      const draft = {
        id: draftId,
        ...draftData,
        lastModified: new Date().toISOString(),
        isComplete: this.isDraftComplete(draftData)
      };
      
      drafts[draftId] = draft;
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      
      console.log('✅ Borrador guardado:', draftId);
      return { success: true, draftId };
    } catch (error) {
      console.error('❌ Error guardando borrador:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los borradores
   */
  async getDrafts() {
    try {
      const draftsJson = await AsyncStorage.getItem(DRAFTS_KEY);
      return draftsJson ? JSON.parse(draftsJson) : {};
    } catch (error) {
      console.error('❌ Error obteniendo borradores:', error);
      return {};
    }
  }

  /**
   * Obtener un borrador específico
   */
  async getDraft(draftId) {
    try {
      const drafts = await this.getDrafts();
      return drafts[draftId] || null;
    } catch (error) {
      console.error('❌ Error obteniendo borrador:', error);
      return null;
    }
  }

  /**
   * Eliminar un borrador
   */
  async deleteDraft(draftId) {
    try {
      const drafts = await this.getDrafts();
      delete drafts[draftId];
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      
      console.log('✅ Borrador eliminado:', draftId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminando borrador:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener lista de borradores para mostrar
   */
  async getDraftsList() {
    try {
      const drafts = await this.getDrafts();
      return Object.values(drafts).sort((a, b) => 
        new Date(b.lastModified) - new Date(a.lastModified)
      );
    } catch (error) {
      console.error('❌ Error obteniendo lista de borradores:', error);
      return [];
    }
  }

  /**
   * Verificar si un borrador está completo
   */
  isDraftComplete(draftData) {
    const requiredFields = ['title', 'resume', 'date', 'endDate', 'about'];
    return requiredFields.every(field => 
      draftData[field] && draftData[field].toString().trim() !== ''
    );
  }

  /**
   * Limpiar borradores antiguos (más de 30 días)
   */
  async cleanOldDrafts() {
    try {
      const drafts = await this.getDrafts();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let cleaned = false;
      Object.keys(drafts).forEach(draftId => {
        const draft = drafts[draftId];
        if (new Date(draft.lastModified) < thirtyDaysAgo) {
          delete drafts[draftId];
          cleaned = true;
        }
      });
      
      if (cleaned) {
        await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
        console.log('✅ Borradores antiguos limpiados');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error limpiando borradores:', error);
      return { success: false, error: error.message };
    }
  }
}

const draftService = new DraftService();
export default draftService;