'use strict';

/**
 * Utility for formatting values (Currency, Percentage, etc)
 */
class Formatter {
    /**
     * Formats a number as Brazilian Real (BRL)
     * @param {number|null} value 
     * @returns {string}
     */
    static money(value) {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        const n = Number(value);
        return `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
    }

    /**
     * Formats a number as percentage
     * @param {number|null} value 
     * @returns {string}
     */
    static percent(value) {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        const n = Number(value);
        return `${n.toFixed(1)}%`;
    }

    /**
     * Formats a date to ISO string (short version)
     * @param {Date|string} date 
     * @returns {string}
     */
    static shortDate(date) {
        return new Date(date).toISOString().slice(0, 10);
    }
}

module.exports = Formatter;
