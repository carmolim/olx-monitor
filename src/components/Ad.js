'use strict';

const notifier = require('./Notifier');
const $logger = require('./Logger');
const Formatter = require('../utils/Formatter');
const adRepository = require('../repositories/adRepository.js');
const scrapperRepository = require('../repositories/scrapperRepository.js');
const subscriptionRepository = require('../repositories/subscriptionRepository.js');
const { theilSen } = require('./Trend');

/**
 * Ad class representing a single OLX listing with rich market intelligence
 */
class Ad {
    constructor(ad) {
        this.id = ad.id;
        this.url = ad.url;
        this.title = ad.title;
        this.searchTerm = ad.searchTerm;
        this.searchUrl = ad.searchUrl;
        this.price = ad.price;
        this.notify = ad.notify; 
        this.valid = this.isValidAd();
        this.saved = null;
    }

    async buildMarketAnalysis() {
        if (!this.searchUrl) return '';

        try {
            const latest = await scrapperRepository.getLatestLog(this.searchUrl);
            if (!latest) return '';

            const sampleSize = Number(latest.sampleSize || 0);
            
            if (sampleSize < 10) {
                return [
                    '📊 <b>Dados limitados</b>',
                    `Amostra: apenas ${sampleSize} anúncios`,
                    'Aguarde mais varreduras para análise detalhada.',
                    '',
                    `Mediana atual: ${Formatter.money(latest.medianPrice)}`,
                    `Preço deste anúncio: ${Formatter.money(this.price)}`
                ].join('\n');
            }
            
            const median = Number(latest.medianPrice || 0);
            const average = Number(latest.averagePrice || 0);
            const cv = Number(latest.cvPrice || 0);

            const recommendedMetric = cv <= 0.30 ? 'media' : 'mediana';
            const referenceValue = recommendedMetric === 'media' ? average : median;
            const trend = await this._calculateTrend();

            return this._formatAnalysisOutput({
                sampleSize,
                median,
                average,
                cv,
                recommendedMetric,
                referenceValue,
                trend,
                latest
            });
        } catch (e) {
            $logger.error(`Analysis failed: ${e.message}`);
            return '';
        }
    }

    async _calculateTrend() {
        const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const rows = await scrapperRepository.getLogsSince(this.searchUrl, sinceIso);
        
        const byDay = new Map();
        rows.forEach(r => {
            const day = String(r.created).slice(0, 10);
            const y = Number(r.medianPrice);
            if (Number.isFinite(y) && y > 0) byDay.set(day, y);
        });

        const points = [...byDay.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([, y], idx) => ({ xDays: idx, y }));

        return theilSen(points);
    }

    _formatAnalysisOutput(data) {
        const { sampleSize, median, average, recommendedMetric, referenceValue, trend, latest, cv } = data;
        
        // Trend Text
        let trendText = 'N/A';
        if (trend && trend.spanDays >= 7) {
            const direction = trend.slopePerDay > 0 ? '↑' : trend.slopePerDay < 0 ? '↓' : '→';
            trendText = `${direction} ${trend.slopePerDay.toFixed(2)} R$/dia (${trend.n} dias)`;
        }

        // Volatility
        let cvFriendly = 'N/A';
        if (cv <= 0.30) cvFriendly = `Baixa (Preços parecidos)`;
        else if (cv <= 0.50) cvFriendly = `Moderada`;
        else cvFriendly = `Alta (Preços bagunçados)`;

        // Market Analysis Tips
        let analysis = '';
        if (cv > 0.50) {
            analysis = `⚠️ <b>Dica:</b> Os preços variam muito nesta busca. Foque em opções abaixo de ${Formatter.money(latest.goodPrice)} para garantir o melhor negócio.`;
        } else {
            if (trend && trend.slopePerDay < -5) analysis = `📉 <b>Tendência de queda!</b> Os preços estão caindo recentemente. Ótima época para comprar!`;
            else if (trend && trend.slopePerDay > 5) analysis = `📈 <b>Mercado aquecido!</b> Os preços estão subindo. Se achar um desconto bom, feche logo.`;
            else analysis = `✅ <b>Mercado estável.</b> Use ${Formatter.money(referenceValue)} como sua bússola de preço.`;
        }

        // Contextual Verdict
        let priceContext = '';
        const adPrice = this.price;
        if (adPrice > 0 && referenceValue > 0) {
            const goodPrice = Number(latest.goodPrice || 0);
            if (adPrice <= goodPrice) {
                const discount = Math.round(((referenceValue - adPrice) / referenceValue) * 100);
                priceContext = `💚 <b>EXCELENTE NEGÓCIO:</b> Promoção pura! ${discount}% mais barato que a vitrine do mercado.`;
            } else if (adPrice <= referenceValue * 0.90) {
                const discount = Math.round(((referenceValue - adPrice) / referenceValue) * 100);
                priceContext = `🟢 <b>PREÇO BOM:</b> Encontrado por ${discount}% a menos que a referência atual.`;
            } else if (adPrice <= referenceValue * 1.05) {
                priceContext = `🟡 <b>PREÇO JUSTO:</b> Está cobrando o valor padrão habitual.`;
            } else if (adPrice <= referenceValue * 1.20) {
                const premium = Math.round(((adPrice - referenceValue) / referenceValue) * 100);
                priceContext = `🟠 <b>OFERTA CARA:</b> Pedindo cerca de ${premium}% a mais que outras pessoas.`;
            } else {
                const premium = Math.round(((adPrice - referenceValue) / referenceValue) * 100);
                priceContext = `🔴 <b>MUITO CARO:</b> Totalmente inflacionado! ${premium}% acima do mercado.`;
            }
        }

        const metricLabel = recommendedMetric === 'media' ? 'Valor de Referência (Média)' : 'Valor de Referência (Mediana)';
        const otherMetric = recommendedMetric === 'media' ? 'Mediana (para comparar)' : 'Média Geral (para comparar)';
        const otherValue = recommendedMetric === 'media' ? median : average;

        return [
            '',
            '🧠 <b>Resumo do Mercado</b>',
            `🔍 Base de dados: ${sampleSize} anúncios analisados`,
            `🎯 ${metricLabel}: ${Formatter.money(referenceValue)}`,
            `📊 ${otherMetric}: ${Formatter.money(otherValue)}`,
            latest.modalIntervalStart !== null ? `🔥 Faixa mais anunciada: ${Formatter.money(latest.modalIntervalStart)} a ${Formatter.money(latest.modalIntervalEnd)} (${latest.modalIntervalCount} anúncios)` : '',
            `💡 Preço ideal para compra: Menos de ${Formatter.money(latest.goodPrice)}`,
            `📏 Variação dos anúncios: ${cvFriendly}`,
            `📉 Tendência: ${trendText}`,
            '',
            '📌 <b>O que achamos deste anúncio?</b>',
            priceContext,
            analysis
        ].filter(Boolean).join('\n');
    }

    async process() {
        if (!this.valid) return false;

        try {
            const existingAd = await adRepository.getAd(this.id).catch(() => null);
            
            if (existingAd) {
                this.saved = existingAd;
                return this.checkPriceChange();
            }

            await adRepository.createAd(this);
            $logger.info(`Ad ${this.id} added.`);

            if (this.notify) {
                const analysis = await this.buildMarketAnalysis();
                const msg = `🆕 <b>NOVO ANÚNCIO 🆕</b>\n\n` +
                            `<b>${this.title}</b>\n\n` +
                            `💵 Preço: <b>${Formatter.money(this.price)}</b>\n\n` +
                            `🔗 ${this.url}\n` +
                            analysis;
                
                const subscriptions = await subscriptionRepository.getChatsByUrl(this.searchUrl);
                for (const sub of subscriptions) {
                    let finalMsg = msg;
                    if (sub.username) {
                        finalMsg += `\n\n🔔 @${sub.username}`;
                    }
                    await notifier.sendNotification(sub.chatId, finalMsg, { threadId: sub.threadId });
                }
            }
            return true;
        } catch (error) {
            $logger.error(`Failed to process ad ${this.id}: ${error.message}`);
        }
    }

    async checkPriceChange() {
        if (this.price !== this.saved.price) {
            await adRepository.updateAd(this);

            if (this.price < this.saved.price) {
                $logger.info(`Price reduction detected for ${this.id}`);
                const discount = Math.round(((this.saved.price - this.price) / this.saved.price) * 100);
                const analysis = await this.buildMarketAnalysis();
                
                const msg = `📉 <b>QUEDA DE PREÇO 📉</b>\n\n` +
                            `<b>${this.title}</b>\n\n` +
                            `💵 De: ${Formatter.money(this.saved.price)} → <b>Para: ${Formatter.money(this.price)}</b>\n` +
                            `📊 Desconto: <b>${discount}% OFF</b>\n\n` +
                            `🔗 ${this.url}\n` +
                            analysis;
                
                const subscriptions = await subscriptionRepository.getChatsByUrl(this.searchUrl);
                for (const sub of subscriptions) {
                    let finalMsg = msg;
                    if (sub.username) {
                        finalMsg += `\n\n🔔 @${sub.username}`;
                    }
                    await notifier.sendNotification(sub.chatId, finalMsg, { threadId: sub.threadId });
                }
            }
        }
    }

    isValidAd() {
        return Boolean(!isNaN(this.price) && this.url && this.id);
    }
}

module.exports = Ad;
