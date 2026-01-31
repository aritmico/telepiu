const PROXY_URL = 'https://corsproxy.io/?key=04205805&url=';
const DATA_SOURCE = 'https://sportsonline.st/prog.txt';

const DAYS = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
    'FRIDAY', 'SATURDAY', 'SUNDAY',
];

const DAY_TRANSLATION = {
    'MONDAY': 'Lunedì',
    'TUESDAY': 'Martedì',
    'WEDNESDAY': 'Mercoledì',
    'THURSDAY': 'Giovedì',
    'FRIDAY': 'Venerdì',
    'SATURDAY': 'Sabato',
    'SUNDAY': 'Domenica'
};

let allData = [];

async function init() {
    try {
        const response = await fetch(PROXY_URL + encodeURIComponent(DATA_SOURCE));
        const text = await response.text();
        parseData(text);
        render(allData);
    } catch (error) {
        document.getElementById('match-list').innerHTML = 'Errore nel caricamento dei dati.';
        console.error(error);
    }
}

function parseData(rawText) {
    const lines = rawText.split('\n').map(line => line.trim());
    const languageMap = {};
    let currentDay = 'Prossimi Eventi';
    const processedDays = [];

    const languagePattern = /^([A-Z0-9]+)\s+(.+)$/;
    const matchPattern = /^(\d{2}:\d{2})\s+(.*?)\s*\|\s*(https?:\/\/[^\s]+)/i;

    lines.forEach(line => {
        if (!line) return;

        if (DAYS.includes(line.toUpperCase())) {
            const dayKey = line.toUpperCase();
            currentDay = DAY_TRANSLATION[dayKey] || dayKey;
            processedDays.push({ day: currentDay, matches: [] });
            return;
        }

        if (languagePattern.test(line) && !line.includes('|') && !line.includes('https')) {
            const [, code, language] = line.match(languagePattern);
            languageMap[code.toLowerCase()] = language
                .replace('ENGLISH', 'INGLESE')
                .replace('SPANISH', 'SPAGNOLO')
                .replace('GERMAN', 'TEDESCO')
                .replace('ITALIAN', 'ITALIANO')
                .replace('BRAZILIAN', 'PORTOGHESE');
            return;
        }

        if (matchPattern.test(line)) {
            const [, time, name, url] = line.match(matchPattern);
            const fileKey = url.split('/').pop().split('.')[0].toLowerCase();
            const language = languageMap[fileKey] || null;

            if (processedDays.length === 0) {
                processedDays.push({ day: currentDay, matches: [] });
            }

            processedDays[processedDays.length - 1].matches.push({
                time,
                name,
                url,
                language
            });
        }
    });

    allData = processedDays;
}

function render(data) {
    const list = document.getElementById('match-list');
    let html = '';

    data.forEach(group => {
        if (group.matches.length === 0) return;

        html += `<div class="day-heading">${group.day}</div>`;
        group.matches.forEach(match => {
            html += `
                <a href="${match.url}" target="_blank">
                    <div class="match-card">
                        <div class="match-time">
                            <span class="time-badge">${match.time} UK</span>
                            <span class="time-badge">${String((parseInt(match.time.split(':')[0], 10) + 1) % 24).padStart(2,'0')}:${match.time.split(':')[1]} IT</span>
                        </div>
                        <div class="match-name">${match.name.replace(/^NBA:\s*/i, '').replace(/\s+x\s+/gi, '<br /><span class="vs">contro</span><br />').replace(/\s+@\s+/gi, '<br /><span class="vs">contro</span><br />')}</div>
                        <div class="watch-button-wrapper">
                            <span class="watch-button">Guarda Ora</span>
                            ${match.language ? `<span class="lang-badge"><span class="lang-icon">🎙️</span> ${match.language}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        });
    });

    list.innerHTML = html || '<div class="no-results">Nessuna partita trovata.</div>';
}

document.getElementById('search-input').addEventListener('input', event => {
    const query = event.target.value.toLowerCase();
    document.getElementById('clear-search').style.display = query ? 'block' : 'none';

    const filtered = allData
        .map(group => ({
            ...group,
            matches: group.matches.filter(m => m.name.toLowerCase().includes(query))
        }))
        .filter(group => group.matches.length > 0);

    render(filtered);
});

document.getElementById('clear-search').onclick = () => {
    const input = document.getElementById('search-input');
    input.value = '';
    document.getElementById('clear-search').style.display = 'none';
    render(allData);
    input.focus();
};

init();
