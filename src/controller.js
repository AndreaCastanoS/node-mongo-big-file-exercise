const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Records = require('./records.model');

const BATCH_SIZE = 10000;
const MAX_PARALLEL_INSERTS = 3;

/**
 * Parsea una línea CSV y devuelve un objeto válido o null si está malformada.
 */
function parseLine(line) {
    const parts = line.trim().split(',');

    if (parts.length !== 6) return null;

    const [id, firstname, lastname, email, email2, profession] = parts;
    const numId = Number(id);

    if (isNaN(numId)) return null;

    return {
        id: numId,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        email2: email2.trim(),
        profession: profession.trim(),
    };
}

const upload = async (req, res) => {
    const { file } = req;

    if (!file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const filePath = path.resolve(file.path);
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: stream });

    let batch = [];
    let insertQueue = [];
    let insertedCount = 0;
    let lineCount = 0;
    let skippedLines = 0;

    try {
        for await (const line of rl) {
            lineCount++;
            if (lineCount === 1) continue; // Saltar encabezado

            const record = parseLine(line);
            if (!record) {
                skippedLines++;
                continue;
            }

            batch.push(record);

            if (batch.length >= BATCH_SIZE) {
                insertQueue.push(Records.insertMany(batch));
                batch = [];

                // Ejecutar inserciones en paralelo de a N grupos
                if (insertQueue.length >= MAX_PARALLEL_INSERTS) {
                    const results = await Promise.all(insertQueue);
                    insertedCount += results.reduce((acc, r) => acc + r.length, 0);
                    insertQueue = [];
                }
            }
        }

        // Insertar último batch
        if (batch.length > 0) {
            insertQueue.push(Records.insertMany(batch));
        }

        if (insertQueue.length > 0) {
            const results = await Promise.all(insertQueue);
            insertedCount += results.reduce((acc, r) => acc + r.length, 0);
        }

        // Eliminar archivo temporal
        await fs.promises.unlink(filePath);

        return res.status(200).json({
            message: 'Archivo procesado correctamente.',
            totalInserted: insertedCount,
            totalLines: lineCount - 1,
            skippedLines
        });

    } catch (error) {
        console.error('Error al procesar el archivo:', error);
        return res.status(500).json({ error: 'Error al procesar el archivo' });
    }
};

const list = async (_, res) => {
    try {
        const data = await Records
            .find({})
            .sort({ _id: -1 })
            .limit(10)
            .lean();

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json(err);
    }
};

module.exports = {
    upload,
    list,
};
