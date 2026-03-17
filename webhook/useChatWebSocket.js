import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useState, useCallback, useEffect } from 'react'

const useChatWebSocket = (contactoId, onNuevoMensaje, onMensajeEnviado) => {
    const [enviando, setEnviando] = useState(false)
    const [wsError, setWsError] = useState(null)
    const [reconnectCount, setReconnectCount] = useState(0)

    // Usar variable de entorno o localhost en desarrollo
    const wsUrl = 'https://bitel-websocket.xylure.easypanel.host/'

    const { sendMessage, lastMessage, readyState } = useWebSocket(wsUrl, {
        shouldReconnect: (closeEvent) => {
            // Registrar el intento de reconexión
            console.warn('WebSocket cerrado, intentando reconectar...', closeEvent)
            setReconnectCount(prev => prev + 1)
            return reconnectCount < 10 // Máximo 10 intentos
        },
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onOpen: () => {
            console.log('WebSocket conectado exitosamente')
            setWsError(null)
            setReconnectCount(0)
        },
        onClose: (event) => {
            console.warn('WebSocket desconectado:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            })
        },
        onError: (event) => {
            console.error('Error en WebSocket:', event)
            setWsError({
                message: 'Error de conexión WebSocket',
                timestamp: new Date().toISOString(),
                url: wsUrl
            })
        },
        onReconnectStop: (numAttempts) => {
            console.error(`WebSocket: Se agotaron los ${numAttempts} intentos de reconexión`)
            setWsError({
                message: `Conexión fallida después de ${numAttempts} intentos`,
                timestamp: new Date().toISOString(),
                url: wsUrl
            })
        }
    })

    // Log cuando cambia el estado de conexión
    useEffect(() => {
        const estados = {
            [ReadyState.CONNECTING]: 'Conectando...',
            [ReadyState.OPEN]: 'Conectado',
            [ReadyState.CLOSING]: 'Cerrando...',
            [ReadyState.CLOSED]: 'Desconectado',
            [ReadyState.UNINSTANTIATED]: 'No inicializado'
        }
        console.log(`WebSocket estado: ${estados[readyState]}`)
    }, [readyState])

    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data)

                // Mensaje entrante de otro usuario
                if (data.type === 'nuevo_mensaje' && data.data) {
                    onNuevoMensaje?.(data.data)
                }

                // Confirmación de mensaje enviado exitosamente
                if (data.type === 'mensaje_enviado' && data.success) {
                    onMensajeEnviado?.(data)
                }
            } catch (error) {
                console.error('Error al parsear mensaje WebSocket:', error)
            }
        }
    }, [lastMessage, onNuevoMensaje, onMensajeEnviado])

    const enviarMensaje = useCallback(async (contenido, tipo = 'text') => {
        if (!contenido.trim()) return false

        // Verificar si está conectado antes de intentar enviar
        if (readyState !== ReadyState.OPEN) {
            console.warn('WebSocket no está conectado, no se puede enviar mensaje')
            return false
        }

        setEnviando(true)
        try {
            // Obtener usuario del localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}')

            sendMessage(JSON.stringify({
                action: 'enviar_mensaje',
                id_contacto: contactoId,
                contenido,
                tipo,
                usuario_id: user.id || 1,
                id_empresa: user.id_empresa || 1
            }))
            return true
        } catch (error) {
            console.error('Error al enviar mensaje por WebSocket:', error)
            return false
        } finally {
            setEnviando(false)
        }
    }, [contactoId, sendMessage, readyState])

    return {
        isConnected: readyState === ReadyState.OPEN,
        enviando,
        enviarMensaje,
        error: wsError,
        reconnectCount,
        connectionStatus: {
            [ReadyState.CONNECTING]: 'Conectando',
            [ReadyState.OPEN]: 'Conectado',
            [ReadyState.CLOSING]: 'Cerrando',
            [ReadyState.CLOSED]: 'Desconectado',
            [ReadyState.UNINSTANTIATED]: 'No inicializado'
        }[readyState]
    }
}

export default useChatWebSocket