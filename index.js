const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

async function start() {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('sesion-wilmer')
    const sock = makeWASocket({ version, auth: state, browser: ["Instalaciones Wilmer", "Chrome", "1.0"] })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            console.log('📲 ESCANEA ESTE QR:')
            qrcode.generate(qr, { small: true })
            try {
                await new Promise(r => setTimeout(r, 3000))
                const code = await sock.requestPairingCode("50245481327")
                console.log('\n\n===========================')
                console.log('TU CODIGO ES: ' + code)
                console.log('===========================\n\n')
            } catch(e){ console.log(e) }
        }
        if (connection === 'open') {
            console.log('✅ BOT CONECTADO - SOLO PRIVADOS!')
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== 401
            if (shouldReconnect) start()
        }
    })
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return
        const from = msg.key.remoteJid
        if (from.endsWith('@g.us')) return
        if (from === 'status@broadcast') return
        const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase()
        let respuesta = ''
        if (texto.includes('hola') || texto.includes('buenas') || texto.includes('precio')) {
            respuesta = `*INSTALACIONES WILMER* \n¡Hola! Soy el asistente virtual.\n\nServicios:\n1️⃣ Cámaras\n2️⃣ Alarmas\n3️⃣ Portones\n\nEscribe el número`
        } else if (texto.includes('1')) {
            respuesta = `📹 *CAMARAS* - Desde Q800. ¿Cuántas necesitas?`
        } else {
            respuesta = `Hola, escribe *hola* para ver menú`
        }
        if (respuesta) await sock.sendMessage(from, { text: respuesta })
    })
}
start()
