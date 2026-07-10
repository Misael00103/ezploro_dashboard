"use client"

import React from "react"
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"

const DateFilterModal = ({
  visible,
  selectedDate,
  onClose,
  onDateChange,
  onApply,
  onClear,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.dateModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por Fecha</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateModalContent}>
            <Text style={styles.dateModalSubtitle}>Selecciona una fecha para filtrar los eventos</Text>

            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    onDateChange(date)
                  }
                }}
                style={styles.datePickerIOS}
              />
            ) : (
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={async () => {
                  const DateTimePickerAndroid = require("@react-native-community/datetimepicker")
                  DateTimePickerAndroid.default.open({
                    value: selectedDate || new Date(),
                    onChange: (event, date) => {
                      if (date) {
                        onDateChange(date)
                      }
                    },
                    mode: "date",
                  })
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                <Text style={styles.datePickerButtonText}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Seleccionar fecha"}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.dateModalButtons}>
              <TouchableOpacity style={[styles.dateModalButton, styles.clearDateButton]} onPress={onClear}>
                <Text style={styles.clearDateButtonText}>Limpiar Filtro</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.dateModalButton, styles.applyDateButton]} onPress={onApply}>
                <Text style={styles.applyDateButtonText}>Aplicar Filtro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  dateModalContainer: {
    backgroundColor: "#0F0F23",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dateModalContent: {
    padding: 20,
  },
  dateModalSubtitle: {
    color: "#B8B8D9",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  datePickerIOS: {
    height: 200,
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  datePickerButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    textTransform: "capitalize",
  },
  dateModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dateModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  clearDateButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clearDateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  applyDateButton: {
    backgroundColor: "#8B5CF6",
  },
  applyDateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default DateFilterModal
