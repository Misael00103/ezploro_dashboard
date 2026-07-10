import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import draftService from '../services/draftService';

const DraftsScreen = () => {
  const navigation = useNavigation();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const draftsList = await draftService.getDraftsList();
      setDrafts(draftsList);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrafts();
    setRefreshing(false);
  };

  const handleEditDraft = (draft) => {
    navigation.navigate('CreateEvent', { draft });
  };

  const handleDeleteDraft = (draftId, title) => {
    Alert.alert(
      'Eliminar Borrador',
      `¿Estás seguro de que quieres eliminar el borrador "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await draftService.deleteDraft(draftId);
            if (result.success) {
              setDrafts(prev => prev.filter(d => d.id !== draftId));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDraftItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'rgba(26, 27, 35, 0.8)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      onPress={() => handleEditDraft(item)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 4,
          }}>
            {item.title || 'Borrador sin título'}
          </Text>
          
          {item.resume && (
            <Text style={{
              color: '#B8B8D9',
              fontSize: 14,
              marginBottom: 8,
              numberOfLines: 2,
            }}>
              {item.resume}
            </Text>
          )}
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="time-outline" size={14} color="#8B5CF6" />
            <Text style={{
              color: '#8B5CF6',
              fontSize: 12,
              marginLeft: 4,
            }}>
              Modificado: {formatDate(item.lastModified)}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: item.isComplete ? '#10B981' : '#F59E0B',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: '600',
              }}>
                {item.isComplete ? 'Completo' : 'Incompleto'}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleDeleteDraft(item.id, item.title)}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F23', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF' }}>Cargando borradores...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F23' }}>
      <PageHeader
        title="Borradores"
        subtitle={`${drafts.length} borrador${drafts.length !== 1 ? 'es' : ''}`}
        onBack={() => navigation.goBack()}
      />
      
      <View style={{ flex: 1, padding: 16 }}>
        {drafts.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title="No hay borradores"
            subtitle="Los borradores de eventos aparecerán aquí automáticamente mientras los creas."
          />
        ) : (
          <FlatList
            data={drafts}
            renderItem={renderDraftItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

export default DraftsScreen;