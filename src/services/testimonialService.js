import { API_URL_TESTIMONIALS } from './config';
import { fetchWithAuth } from './userService';

export const getTestimonials = async () => {
  try {
    const response = await fetchWithAuth(`${API_URL_TESTIMONIALS}/list`, {
      method: 'GET',
    });
    return response.data || [];
  } catch (error) {
    console.error('Error en getTestimonials:', error);
    return [];
  }
};

export const getTestimonial = async (testimonialId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_TESTIMONIALS}/${testimonialId}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error('Error en getTestimonial:', error);
    throw error;
  }
};

export const createTestimonial = async (testimonialData) => {
  try {
    const response = await fetchWithAuth(API_URL_TESTIMONIALS, {
      method: 'POST',
      body: JSON.stringify(testimonialData),
    });
    return response.data;
  } catch (error) {
    console.error('Error en createTestimonial:', error);
    throw error;
  }
};

export const updateTestimonial = async (testimonialData) => {
  try {
    const response = await fetchWithAuth(`${API_URL_TESTIMONIALS}/${testimonialData.id}`, {
      method: 'PUT',
      body: JSON.stringify(testimonialData),
    });
    return response.data;
  } catch (error) {
    console.error('Error en updateTestimonial:', error);
    throw error;
  }
};

export const deleteTestimonial = async (testimonialId) => {
  try {
    const response = await fetchWithAuth(`${API_URL_TESTIMONIALS}/${testimonialId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    console.error('Error en deleteTestimonial:', error);
    throw error;
  }
};

export const updateTestimonials = updateTestimonial;