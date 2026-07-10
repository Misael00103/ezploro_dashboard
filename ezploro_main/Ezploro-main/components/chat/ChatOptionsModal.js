import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  TouchableWithoutFeedback 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ChatOptionsModal = ({ 
  visible, 
  onClose, 
  options = [],
  darkMode = false 
}) => {
  const defaultOptions = [
    {
      id: 'view_profile',
      title: 'View Profile',
      icon: 'person-outline',
      color: '#8B5CF6'
    },
    {
      id: 'block_user',
      title: 'Block User',
      icon: 'ban-outline',
      color: '#EF4444'
    },
    {
      id: 'report_user',
      title: 'Report User',
      icon: 'flag-outline',
      color: '#F59E0B'
    },
    {
      id: 'clear_chat',
      title: 'Clear Chat',
      icon: 'trash-outline',
      color: '#EF4444'
    }
  ]

  const optionsToShow = options.length > 0 ? options : defaultOptions

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, darkMode && styles.containerDark]}>
              <View style={styles.header}>
                <Text style={[styles.title, darkMode && styles.titleDark]}>
                  Chat Options
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={darkMode ? "#FFFFFF" : "#1F2937"} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.optionsContainer}>
                {optionsToShow.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionItem, darkMode && styles.optionItemDark]}
                    onPress={() => {
                      option.onPress && option.onPress()
                      onClose()
                    }}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={20} 
                      color={option.color} 
                      style={styles.optionIcon}
                    />
                    <Text style={[
                      styles.optionText, 
                      darkMode && styles.optionTextDark,
                      { color: option.color }
                    ]}>
                      {option.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
  },
  containerDark: {
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionItemDark: {
    backgroundColor: '#1F2937',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextDark: {
    color: '#FFFFFF',
  },
})

export default ChatOptionsModal