'use strict';

/**
 * PriceAnalyzer component for calculating statistical measures of property/ad prices.
 */
class PriceAnalyzer {
    /**
     * Calculates comprehensive price statistics from an array of numeric values.
     * @param {number[]} values - Array of prices
     * @returns {Object} Statistical summary
     */
    static calculateStats(values) {
        const clean = values
            .filter((v) => Number.isFinite(v) && v > 0)
            .map((v) => Math.trunc(v));
        
        const count = clean.length;

        if (count === 0) {
            return this._emptyStats();
        }

        const sorted = [...clean].sort((a, b) => a - b);
        
        // Basic stats
        const median = this._calculateMedian(sorted);
        const { q1, q3, iqr, outlierLow, outlierHigh } = this._calculateQuartiles(sorted);

        // Filter outliers for more stable averages/modes
        const filteredPrices = clean.filter(v => v >= outlierLow && v <= outlierHigh);
        const targetPrices = filteredPrices.length > 0 ? filteredPrices : clean;
        const trmCount = targetPrices.length;

        const minPriceFiltered = filteredPrices.length > 0 ? Math.min(...filteredPrices) : sorted[0];
        const maxPriceFiltered = filteredPrices.length > 0 ? Math.max(...filteredPrices) : sorted[sorted.length - 1];

        // Advanced metrics
        const mode = this._calculateMode(targetPrices);
        const { modalInterval, modalTop3BinsJson } = this._calculateModalIntervals(targetPrices, minPriceFiltered, maxPriceFiltered);
        
        const avg = targetPrices.reduce((a, b) => a + b, 0) / trmCount;
        const stdDev = this._calculateStdDev(targetPrices, avg);
        const cv = avg > 0 ? stdDev / avg : null;

        // Recommendation heuristic
        const avgStable = trmCount >= 10 && cv !== null && cv <= 0.20;
        const recommended = count < 5 ? 'median' : avgStable ? 'average' : 'median';

        return {
            count,
            q1, q3, iqr,
            outlierLow, outlierHigh,
            median,
            mode,
            modalInterval,
            modalTop3BinsJson,
            goodPrice: this._calculatePercentile(sorted, 0.45), // P45 as "Good Price"
            goodPriceType: 'p45',
            stdDev: Number.isFinite(stdDev) ? stdDev : null,
            cv,
            recommended,
            minPriceFiltered,
            maxPriceFiltered,
            average: avg,
        };
    }

    static _calculateMedian(sorted) {
        const count = sorted.length;
        const mid = Math.floor(count / 2);
        return count % 2 === 0 
            ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) 
            : sorted[mid];
    }

    static _calculatePercentile(sorted, p) {
        const count = sorted.length;
        if (count === 1) return sorted[0];
        const idx = (count - 1) * p;
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        if (lo === hi) return sorted[lo];
        const w = idx - lo;
        return Math.round(sorted[lo] * (1 - w) + sorted[hi] * w);
    }

    static _calculateQuartiles(sorted) {
        const q1 = this._calculatePercentile(sorted, 0.25);
        const q3 = this._calculatePercentile(sorted, 0.75);
        const iqr = q3 - q1;
        return {
            q1, q3, iqr,
            outlierLow: Math.round(q1 - 1.5 * iqr),
            outlierHigh: Math.round(q3 + 1.5 * iqr)
        };
    }

    static _calculateMode(values) {
        const freq = new Map();
        let mode = null;
        let modeCount = 1;
        for (const v of values) {
            const c = (freq.get(v) || 0) + 1;
            freq.set(v, c);
            if (c > modeCount) {
                mode = v;
                modeCount = c;
            }
        }
        return mode;
    }

    static _calculateModalIntervals(values, min, max) {
        const range = max - min;
        const binWidth = Math.max(1, Math.floor(range * 0.10));
        const bins = new Map();

        for (const v of values) {
            const idx = Math.floor((v - min) / binWidth);
            bins.set(idx, (bins.get(idx) || 0) + 1);
        }

        const sortedBins = [...bins.entries()]
            .sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))
            .slice(0, 3)
            .map(([idx, c]) => {
                const start = min + idx * binWidth;
                return { start, end: start + binWidth, width: binWidth, count: c, label: `${start}-${start + binWidth}` };
            });

        return {
            modalInterval: sortedBins[0] || null,
            modalTop3BinsJson: JSON.stringify(sortedBins)
        };
    }

    static _calculateStdDev(values, avg) {
        if (values.length === 0) return 0;
        const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    static _emptyStats() {
        return {
            count: 0, median: null, mode: null, modalInterval: null,
            stdDev: null, cv: null, recommended: 'none'
        };
    }
}

module.exports = PriceAnalyzer;
