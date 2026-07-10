// utils/chatDiagnostics.js - Utilidades para diagnosticar problemas de chat
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BASE_URL } from "../config"

class ChatDiagnostics {
    // Ejecutar diagnóstico completo del sistema de chat
    async runFullDiagnostic(userId) {
        console.log("🔍 Iniciando diagnóstico completo del sistema de chat...")
        
        const results = {
            timestamp: new Date().toISOString(),
            userId: userId,
            tests: {}
        }

        // Test 1: Verificar configuración
        results.tests.config = await this.testConfiguration()
        
        // Test 2: Verificar autenticación
        results.tests.auth = await this.testAuthentication()
        
        // Test 3: Verificar conectividad del backend
        results.tests.backend = await this.testBackendConnectivity(userId)
        
        // Test 4: Verificar rutas de chat privado
        results.tests.privateChat = await this.testPrivateChatRoutes(userId)
        
        // Test 5: Verificar Socket.IO
        results.tests.socket = await this.testSocketConnection()
        
        // Test 6: Verificar servicios
        results.tests.services = await this.testServices()

        // Generar reporte
        this.generateReport(results)
        
        return results
    }

    // Test de configuración
    async testConfiguration() {
        console.log("🔧 Testing configuration...")
        
        const test = {
            name: "Configuration Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            // Verificar BASE_URL
            if (!BASE_URL) {
                test.passed = false
                test.issues.push("BASE_URL no está definida")
            } else {
                test.details.baseUrl = BASE_URL
                
                // Verificar formato de URL
                if (!BASE_URL.startsWith('http')) {
                    test.passed = false
                    test.issues.push("BASE_URL no tiene formato válido")
                }
            }

            // Verificar rutas de chat
            const chatRoutes = [
                `${BASE_URL}/private-messages`,
                `${BASE_URL}/private-messages/user`,
                `${BASE_URL}/private-messages/create`
            ]
            
            test.details.chatRoutes = chatRoutes

        } catch (error) {
            test.passed = false
            test.issues.push(`Error en configuración: ${error.message}`)
        }

        return test
    }

    // Test de autenticación
    async testAuthentication() {
        console.log("🔐 Testing authentication...")
        
        const test = {
            name: "Authentication Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            const token = await AsyncStorage.getItem("token")
            
            if (!token) {
                test.passed = false
                test.issues.push("No hay token de autenticación")
            } else {
                test.details.hasToken = true
                test.details.tokenLength = token.length
                
                // Verificar formato básico del token
                if (token.length < 10) {
                    test.passed = false
                    test.issues.push("Token parece ser inválido (muy corto)")
                }
            }

        } catch (error) {
            test.passed = false
            test.issues.push(`Error verificando autenticación: ${error.message}`)
        }

        return test
    }

    // Test de conectividad del backend
    async testBackendConnectivity(userId) {
        console.log("🌐 Testing backend connectivity...")
        
        const test = {
            name: "Backend Connectivity Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            const token = await AsyncStorage.getItem("token")
            
            // Test básico de conectividad
            const response = await fetch(`${BASE_URL}/private-messages/user/${userId}`, {
                method: "HEAD",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000
            })

            test.details.responseStatus = response.status
            test.details.responseHeaders = Object.fromEntries(response.headers.entries())

            if (!response.ok) {
                if (response.status === 404) {
                    test.issues.push("Ruta no encontrada - verificar que el backend tenga las rutas registradas")
                } else if (response.status === 401) {
                    test.passed = false
                    test.issues.push("Error de autenticación - token inválido")
                } else {
                    test.issues.push(`Error HTTP ${response.status}`)
                }
            }

        } catch (error) {
            test.passed = false
            test.issues.push(`Error de conectividad: ${error.message}`)
        }

        return test
    }

    // Test de rutas de chat privado
    async testPrivateChatRoutes(userId) {
        console.log("💬 Testing private chat routes...")
        
        const test = {
            name: "Private Chat Routes Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            const token = await AsyncStorage.getItem("token")
            const routes = [
                {
                    name: "Get User Chats",
                    url: `${BASE_URL}/private-messages/user/${userId}`,
                    method: "GET"
                },
                {
                    name: "Get Chat User Info",
                    url: `${BASE_URL}/private-messages/chat-user/${userId}`,
                    method: "GET"
                }
            ]

            for (const route of routes) {
                try {
                    const response = await fetch(route.url, {
                        method: route.method,
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 10000
                    })

                    test.details[route.name] = {
                        status: response.status,
                        ok: response.ok
                    }

                    if (!response.ok && response.status !== 404) {
                        test.issues.push(`${route.name}: HTTP ${response.status}`)
                    }

                } catch (routeError) {
                    test.passed = false
                    test.issues.push(`${route.name}: ${routeError.message}`)
                }
            }

        } catch (error) {
            test.passed = false
            test.issues.push(`Error testing routes: ${error.message}`)
        }

        return test
    }

    // Test de conexión Socket.IO
    async testSocketConnection() {
        console.log("🔌 Testing Socket.IO connection...")
        
        const test = {
            name: "Socket.IO Connection Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            // Importar servicio de socket
            const { default: socketChatIntegration } = await import("../services/socketChatIntegration")
            
            const status = socketChatIntegration.getStatus()
            test.details.socketStatus = status

            if (!status.isConnected) {
                test.issues.push("Socket.IO no está conectado")
            }

        } catch (error) {
            test.passed = false
            test.issues.push(`Error testing Socket.IO: ${error.message}`)
        }

        return test
    }

    // Test de servicios
    async testServices() {
        console.log("🛠️ Testing services...")
        
        const test = {
            name: "Services Test",
            passed: true,
            issues: [],
            details: {}
        }

        try {
            // Test servicio de chat privado
            const { default: privateChatService } = await import("../services/privateChatService")
            test.details.privateChatService = {
                isInitialized: privateChatService.isInitialized,
                currentUserId: privateChatService.currentUserId
            }

            // Test servicio integrado
            const { default: chatIntegrationService } = await import("../services/chatIntegrationService")
            test.details.chatIntegrationService = {
                isInitialized: chatIntegrationService.isInitialized,
                currentUserId: chatIntegrationService.currentUserId
            }

        } catch (error) {
            test.passed = false
            test.issues.push(`Error testing services: ${error.message}`)
        }

        return test
    }

    // Generar reporte de diagnóstico
    generateReport(results) {
        console.log("\n" + "=".repeat(50))
        console.log("📊 REPORTE DE DIAGNÓSTICO DE CHAT")
        console.log("=".repeat(50))
        console.log(`Timestamp: ${results.timestamp}`)
        console.log(`User ID: ${results.userId}`)
        console.log("")

        let totalTests = 0
        let passedTests = 0

        for (const [testName, testResult] of Object.entries(results.tests)) {
            totalTests++
            if (testResult.passed) passedTests++

            const status = testResult.passed ? "✅ PASS" : "❌ FAIL"
            console.log(`${status} ${testResult.name}`)
            
            if (testResult.issues.length > 0) {
                testResult.issues.forEach(issue => {
                    console.log(`   ⚠️ ${issue}`)
                })
            }
            
            console.log("")
        }

        console.log("=".repeat(50))
        console.log(`RESUMEN: ${passedTests}/${totalTests} tests pasaron`)
        
        if (passedTests === totalTests) {
            console.log("🎉 Todos los tests pasaron - el sistema de chat debería funcionar correctamente")
        } else {
            console.log("⚠️ Algunos tests fallaron - revisar los problemas reportados")
        }
        
        console.log("=".repeat(50) + "\n")
    }

    // Función de ayuda para diagnosticar problemas específicos
    async quickDiagnostic(userId) {
        console.log("⚡ Ejecutando diagnóstico rápido...")
        
        const issues = []
        
        // Verificar configuración básica
        if (!BASE_URL) {
            issues.push("❌ BASE_URL no configurada")
        }
        
        // Verificar token
        const token = await AsyncStorage.getItem("token")
        if (!token) {
            issues.push("❌ No hay token de autenticación")
        }
        
        // Verificar conectividad básica
        try {
            const response = await fetch(`${BASE_URL}/private-messages/user/${userId}`, {
                method: "HEAD",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                timeout: 5000
            })
            
            if (!response.ok) {
                issues.push(`❌ Backend no responde correctamente (${response.status})`)
            }
        } catch (error) {
            issues.push(`❌ Error de conectividad: ${error.message}`)
        }
        
        if (issues.length === 0) {
            console.log("✅ Diagnóstico rápido: Todo parece estar bien")
        } else {
            console.log("⚠️ Problemas encontrados:")
            issues.forEach(issue => console.log(`   ${issue}`))
        }
        
        return issues
    }
}

export default new ChatDiagnostics()