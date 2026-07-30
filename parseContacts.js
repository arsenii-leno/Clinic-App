// parseContacts.js
const fs = require('fs');
const path = require('path');

// 1. Читаємо VCF-файл
const vcfPath = path.join(__dirname, 'contacts.vcf');
if (!fs.existsSync(vcfPath)) {
    console.error('❌ Файл contacts.vcf не знайдено в корені проєкту!');
    process.exit(1);
}

const vcfContent = fs.readFileSync(vcfPath, 'utf-8');

// 2. Розбиваємо на окремі візитки
// VCF завжди закінчується на END:VCARD (іноді з \r\n)
const rawCards = vcfContent
    .split(/END:VCARD/i)
    .map(card => card.trim())
    .filter(card => card.length > 10); // відкидаємо порожні

console.log(`Знайдено ${rawCards.length} сирих карток`);

// 3. Парсимо кожну картку
const patients = rawCards.map((card, idx) => {
    const nameMatch = card.match(/FN:(.+?)(?:\r?\n|$)/i);
    const phoneMatch =
        card.match(/TEL;[^:]*:(.+?)(?:\r?\n|$)/i) ||
        card.match(/TEL:(.+?)(?:\r?\n|$)/i);

    const fullName = nameMatch ? nameMatch[1].trim() : null;
    const rawPhone = phoneMatch ? phoneMatch[1].trim() : '';
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!fullName && !cleanPhone) return null;

    // Розбиваємо ім’я на firstName + lastName
    const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || 'Без імені';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
        id: `imported_${Date.now()}_${idx}`,
        firstName,
        lastName,
        childName: '',
        phone: cleanPhone,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}).filter(Boolean); // no null

// 4. Записуємо результат
const outputDir = path.join(__dirname, 'assets');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'seedPatients.json');
fs.writeFileSync(outputPath, JSON.stringify(patients, null, 2), 'utf-8');

console.log(`✅ Успішно розпарсено ${patients.length} контактів`);
console.log(`Файл збережено: ${outputPath}`);