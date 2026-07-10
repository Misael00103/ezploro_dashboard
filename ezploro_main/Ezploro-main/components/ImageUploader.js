import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useImageUpload from '../hooks/useImageUpload';

/**
 * Componente reutilizable para subir imágenes
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de imagen (profile, event, post, etc.)
 * @param {string} props.category - Categoría específica
 * @param {number} props.userId - ID del usuario
 * @param {number} props.eventId - ID del evento (opcional)
 * @param {string} props.currentImageUrl - URL de imagen actual (opcional)
 * @param {Function} props.onImageUploaded - Callback cuando se sube la imagen
 * @param {Object} props.style - Estilos personalizados
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.showProgress - Mostrar barra de progreso
 */
const ImageUploader = ({
  type = 'general',
  category = 'default',
  userId,
  eventId,
  currentImageUrl,
  onImageUploaded,
  style,
  placeholder = 'Seleccionar imagen',
  showProgress = true,
  ...props
}) => {
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImageUrl);

  const {
    uploading,
    uploadProgress,
    error,
    uploadedImage,
    selectAndUploadFromGallery,
    takePhotoAndUpload,
    clearStates,
  } = useImageUpload({
    aspect: type === 'profile' ? [1, 1] : [16, 9],
    quality: 0.8,
  });

  const handleImageSelection = () => {
    setShowModal(true);
  };

  const handleGallerySelection = async () => {
    setShowModal(false);
    clearStates();

    const result = await selectAndUploadFromGallery({
      type,
      category,
      userId,
      eventId,
    });

    if (result && result.success) {
      setPreviewImage(result.fullUrl);
      onImageUploaded && onImageUploaded(result);
    }
  };

  const handleCameraSelection = async () => {
    setShowModal(false);
    clearStates();

    const result = await takePhotoAndUpload({
      type,
      category,
      userId,
      eventId,
    });

    if (result && result.success) {
      setPreviewImage(result.fullUrl);
      onImageUploaded && onImageUploaded(result);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPreviewImage(null);
            onImageUploaded && onImageUploaded(null);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.uploadButton,
          previewImage && styles.uploadButtonWithImage,
          uploading && styles.uploadButtonLoading,
        ]}
        onPress={handleImageSelection}
        disabled={uploading}
        {...props}
      >
        {previewImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: previewImage }} style={styles.previewImage} />
            {!uploading && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="camera"
              size={32}
              color="#8B5CF6"
              style={styles.placeholderIcon}
            />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}

        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            {showProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Modal de selección */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar imagen</Text>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleGallerySelection}
            >
              <Ionicons name="images" size={24} color="#8B5CF6" />
              <Text style={styles.modalOptionText}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCameraSelection}
            >
              <Ionicons name="camera" size={24} color="#8B5CF6" />
              <Text style={styles.modalOptionText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
  },
  uploadButtonWithImage: {
    borderStyle: 'solid',
    borderColor: '#8B5CF6',
    padding: 0,
  },
  uploadButtonLoading: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: 8,
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  progressContainer: {
    marginTop: 16,
    width: '80%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#1F2937',
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#6B7280',
  },
});

export default ImageUploader;