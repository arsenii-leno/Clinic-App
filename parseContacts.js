// parseContacts.js
const fs = require('fs');
const path = require('path');

const vcfPath = path.join(__dirname, 'contacts.vcf');
if (!fs.existsSync(vcfPath)) {
    console.error('❌ Файл contacts.vcf не знайдено!');
    process.exit(1);
}

let vcfContent = fs.readFileSync(vcfPath, 'utf-8');

// Прибираємо можливий BOM
vcfContent = vcfContent.replace(/^\uFEFF/, '');

// ========== Декодування Quoted-Printable ==========
function decodeQuotedPrintable(input) {
    if (!input) return '';

    // 1. Прибираємо soft line breaks (= на кінці рядка разом із переносом)
    let cleaned = input.replace(/=\r?\n/g, '').replace(/=\n/g, '');

    // 2. Видаляємо випадкові переноси рядків всередині зашифрованого блоку
    cleaned = cleaned.replace(/[\r\n]+/g, '');

    const bytes = [];
    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '=' && i + 2 < cleaned.length) {
            const hex = cleaned.substring(i + 1, i + 3);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
                bytes.push(parseInt(hex, 16));
                i += 2;
                continue;
            }
        }
        bytes.push(cleaned.charCodeAt(i));
    }

    try {
        return Buffer.from(bytes).toString('utf-8');
    } catch {
        return cleaned;
    }
}

// ========== Очищення імені ==========
function cleanNameString(str) {
    if (!str) return '';
    return str
        .replace(/\b[Дд]\b/g, '')
        .replace(/\+/g, '')
        .replace(/[^\p{L}\s'\u02BC\u0301-]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ========== Розбиття на картки ==========
const rawCards = vcfContent
    .split(/END:VCARD/i)
    .map(c => c.trim())
    .filter(c => c.length > 20);

console.log(`Знайдено ${rawCards.length} сирих карток`);

const patients = rawCards.map((card, idx) => {
    // ----- Ім'я (FN або N) -----
    let rawName = '';

    const fnMatch = card.match(/^FN(?:;[^:\r\n]*)?:([\s\S]*?)(?=\r?\n[A-Z0-9-]+[;:]|\r?\n$)/im);
    const nMatch  = card.match(/^N(?:;[^:\r\n]*)?:([\s\S]*?)(?=\r?\n[A-Z0-9-]+[;:]|\r?\n$)/im);

    if (fnMatch) {
        rawName = fnMatch[1];
    } else if (nMatch) {
        rawName = nMatch[1].replace(/;/g, ' ');
    }

    let decodedName = decodeQuotedPrintable(rawName).trim();

    // ----- Телефон -----
    const phoneMatch = card.match(/^TEL(?:;[^:\r\n]*)?:([^\r\n]+)/im);
    const rawPhone = phoneMatch ? phoneMatch[1].trim() : '';
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!decodedName && !cleanPhone) return null;

    // ----- Дитина через / -----
    let parentPart = decodedName;
    let childName = '';

    if (decodedName.includes('/')) {
        const parts = decodedName.split('/');
        parentPart = parts[0];
        childName = cleanNameString(parts.slice(1).join(' '));
    }

    const cleanParent = cleanNameString(parentPart);
    const words = cleanParent ? cleanParent.split(/\s+/) : [];

    let firstName = ' ';
    let lastName = ' ';

    if (words.length === 1) {
        lastName = words[0];
        firstName = ' ';
    } else if (words.length >= 2) {
        lastName = words[0];
        firstName = words.slice(1).join(' ');
    }
    // якщо words.length === 0, то залишаються " "

    return {
        id: `imported_${Date.now()}_${idx}`,
        firstName: firstName || ' ',
        lastName: lastName || ' ',
        childName: childName || '',
        phone: cleanPhone || '',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}).filter(Boolean);

// ========== Запис ==========
const outputDir = path.join(__dirname, 'assets');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'seedPatients.json');
fs.writeFileSync(outputPath, JSON.stringify(patients, null, 2), 'utf-8');

console.log(`✅ Успішно декодовано ${patients.length} контактів`);
console.log(`Файл: ${outputPath}`);