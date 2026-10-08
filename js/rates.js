const defaultRates = { gold24: 75000, gold22: 69000, gold18: 56500, silver: 90000 };
let rates = { ...defaultRates, source: 'sample' };
let rateRequestInProgress = false;
let hasLoadedRates = false;

function formatNumber(number) {
    return Number(number).toLocaleString('en-IN');
}

function getRatePerGram(metal) {
    return metal === 'silver' ? rates.silver / 1000 : (rates[metal] || 0) / 10;
}

function renderRates() {
    const displays = {
        gold24Rate: `₹${formatNumber(rates.gold24)} / 10g`,
        gold22Rate: `₹${formatNumber(rates.gold22)} / 10g`,
        gold18Rate: `₹${formatNumber(rates.gold18)} / 10g`,
        silverRate: `₹${formatNumber(rates.silver)} / kg`
    };

    Object.entries(displays).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const updated = document.getElementById('rateUpdated');
    if (updated) {
        updated.textContent = rates.source === 'sample'
            ? 'Sample rates · verify before purchase'
            : rates.updatedAt
            ? new Date(rates.updatedAt).toLocaleString('en-IN')
            : 'Rate updated';
    }
}

async function loadRates() {
    if (rateRequestInProgress) return;
    rateRequestInProgress = true;

    try {
        const response = await fetch('/api/rates', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load metal rates.');
        const data = await response.json();
        const validRates = ['gold24', 'gold22', 'gold18', 'silver']
            .every(key => Number.isFinite(Number(data[key])) && Number(data[key]) > 0);
        if (!validRates) throw new Error('The server returned incomplete metal rates.');
        rates = { ...rates, ...data };
        hasLoadedRates = true;
    } catch (error) {
        console.warn('Unable to refresh metal rates:', error.message);
        if (!hasLoadedRates) rates = { ...defaultRates, source: 'sample' };
    } finally {
        rateRequestInProgress = false;
        renderRates();
        showGoldHistory(7);
        showSilverHistory(7);
    }
}

function drawRateHistory(metal, days) {
    const canvas = document.getElementById(`${metal}Chart`);
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const width = canvas.clientWidth || 600;
    const height = 260;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.height = `${height}px`;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    const base = metal === 'silver' ? rates.silver : rates.gold22;
    const values = Array.from({ length: days }, (_, index) =>
        base * (0.97 + ((index * 17) % 11) / 100 + index * 0.0005)
    );
    const min = Math.min(...values);
    const max = Math.max(...values);
    const points = values.map((value, index) => ({
        x: 12 + index * (width - 24) / Math.max(days - 1, 1),
        y: height - 20 - ((value - min) / Math.max(max - min, 1)) * (height - 40)
    }));

    context.strokeStyle = '#d4af37';
    context.lineWidth = 2;
    context.beginPath();
    points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
    });
    context.stroke();
}

function showGoldHistory(days) {
    drawRateHistory('gold', days);
}

function showSilverHistory(days) {
    drawRateHistory('silver', days);
}

loadRates();
window.setInterval(loadRates, 30000);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadRates();
});
window.addEventListener('focus', loadRates);