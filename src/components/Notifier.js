'use strict';

const config = require('../config');
const $logger = require('./Logger');

/**
 * Envia uma notificação via Telegram utilizando o fetch nativo do Node.js
 * @param {string|number} chatId - O ID do chat no Telegram
 * @param {string} msg - A mensagem a ser enviada
 * @param {Object} extra - Parâmetros extras (como reply_markup ou message_thread_id)
 */
exports.sendNotification = async (chatId, msg, extra = {}) => {
    const startedAt = new Date().toISOString();
    
    // Suporte para tópicos (threads)
    const threadId = extra.threadId || extra.message_thread_id || null;
    
    $logger.info(
        `[Telegram] sendMessage para chat ${chatId}${threadId ? ` (Tópico ${threadId})` : ''} em ${startedAt}`
    );

    try {
        const apiUrl = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
        
        const payload = {
            chat_id: chatId,
            text: msg,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...extra
        };

        // Garante que o nome do campo para o Telegram seja o correto
        if (threadId) {
            payload.message_thread_id = threadId;
            delete payload.threadId; // Limpa o alias se existir
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Telegram API Error: ${response.status} - ${errorText}`);
        }

        $logger.info(
            `[Telegram] sendMessage concluída em ${new Date().toISOString()} (HTTP ${response.status})`
        );
        
        return response;
    } catch (error) {
        $logger.error(`[Telegram] Erro ao enviar notificação: ${error.message}`);
        return null;
    }
};
