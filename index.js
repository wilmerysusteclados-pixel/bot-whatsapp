const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
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
        if (texto.includes('hola') || texto.includes('buenas') || texto.includes('precio') || texto.trim() === '') {
            respuesta = `🔧 *INSTALACIONES WILMER* 🔧\n¡Hola! Soy el asistente virtual.\n\n*Servicios:*\n1️⃣ Instalación Mini Split - Q350\n2️⃣ Mantenimiento - Q200\n3️⃣ Carga de Gas - Q250\n4️⃣ Reparación - Q100\n\nEscriba el *número*.\n📍 San Luis, Petén`
        } else if (texto.includes('1')) {
            respuesta = `✅ *Instalación Q350*\n¿En qué aldea/colonia es?`
        } else if (texto.includes('2')) {
            respuesta = `✅ *Mantenimiento Q200* por equipo.`
        } else if (texto.includes('3')) {
            respuesta = `✅ *Carga Gas Desde Q250*`
        } else {
            respuesta = `Gracias por escribir a *Instalaciones Wilmer* 🙏\nEscriba *HOLA* para menú.`
        }
        await sock.sendMessage(from, { text: respuesta })
    })
}
start()
