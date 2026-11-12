/**
 * Генерация canvas-текстур блоков и преобразование пиксельных матриц.
 */
export class TileTextureGenerator {
    createMatrixCanvas(matrix, palette, scale = 2) {
        const h = matrix.length;
        const w = matrix[0].length;
        const c = document.createElement('canvas');
        c.width = w * scale;
        c.height = h * scale;
        const ctx = c.getContext('2d');
        for (let y = 0; y < h; y++) {
            const row = matrix[y];
            for (let x = 0; x < w; x++) {
                const ch = row[x];
                if (ch !== '.' && palette[ch]) {
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }
        return c;
    }

    generateTileTexture(baseColor, darkColor, lightColor, specColor = null, pattern = 'rock') {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 16, 16);

        let seed = baseColor.charCodeAt(1) * 37 + pattern.charCodeAt(0) * 23;
        const rand = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };

        // Выразительная объемная кромка блока (16-bit Pixel Art рельеф)
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, 15, 1);
        ctx.fillRect(0, 1, 1, 14);
        ctx.fillStyle = darkColor;
        ctx.fillRect(0, 15, 16, 1);
        ctx.fillRect(15, 0, 1, 16);

        for (let y = 1; y < 15; y++) {
            for (let x = 1; x < 15; x++) {
                const r = rand();
                if (r < 0.18) {
                    ctx.fillStyle = darkColor;
                    ctx.fillRect(x, y, 2, 1);
                } else if (r < 0.34) {
                    ctx.fillStyle = lightColor;
                    ctx.fillRect(x, y, 2, 1);
                }
            }
        }

        // Декоративные прожилки мха для мягкого грунта и раскаленные прожилки для базальта
        if (pattern === 'moss_rock') {
            ctx.fillStyle = '#34d399';
            ctx.fillRect(2, 1, 4, 2);
            ctx.fillRect(9, 1, 5, 2);
            ctx.fillRect(4, 2, 2, 2);
            ctx.fillStyle = '#a7f3d0';
            ctx.fillRect(3, 1, 2, 1);
            ctx.fillRect(10, 1, 2, 1);
        }

        if (pattern === 'magma_rock') {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(3, 4, 4, 1);
            ctx.fillRect(6, 5, 3, 1);
            ctx.fillRect(9, 11, 4, 1);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(4, 4, 2, 1);
            ctx.fillRect(10, 11, 2, 1);
        }

        if (pattern === 'bedrock_wall') {
            // Стальная обшивка шахты с желто-черными полосами безопасности и заклепками
            ctx.fillStyle = '#334155';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#475569';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(2, 6, 12, 4);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(3, 6, 2, 4);
            ctx.fillRect(7, 6, 2, 4);
            ctx.fillRect(11, 6, 2, 4);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(2, 2, 2, 2);
            ctx.fillRect(12, 2, 2, 2);
            ctx.fillRect(2, 12, 2, 2);
            ctx.fillRect(12, 12, 2, 2);
        }

        if (specColor && pattern === 'ore') {
            const clusters = [[2, 3], [9, 3], [4, 9], [10, 10]];
            clusters.forEach(([cx, cy]) => {
                ctx.fillStyle = darkColor;
                ctx.fillRect(cx - 1, cy - 1, 5, 4);
                ctx.fillStyle = specColor;
                ctx.fillRect(cx, cy, 4, 3);
                ctx.fillRect(cx + 1, cy - 1, 2, 5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(cx + 1, cy, 2, 1);
            });
        }

        if (specColor && pattern === 'crystal') {
            // Крупные сияющие друзы самоцветов
            ctx.fillStyle = specColor;
            ctx.fillRect(2, 5, 3, 8);
            ctx.fillRect(6, 2, 4, 12);
            ctx.fillRect(11, 4, 3, 9);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(7, 3, 2, 7);
            ctx.fillRect(3, 6, 1, 4);
            ctx.fillRect(12, 5, 1, 5);
        }

        if (pattern === 'energy') {
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(4, 4, 8, 8);
            ctx.fillStyle = '#ecfdf5';
            ctx.fillRect(6, 6, 4, 4);
        }

        if (pattern === 'vitalium') {
            // Изумрудная подложка и яркий рубиново-розовый био-кристалл в форме креста/сердца
            ctx.fillStyle = '#065f46';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#e11d48';
            ctx.fillRect(4, 4, 8, 8);
            ctx.fillStyle = '#fb7185';
            ctx.fillRect(6, 2, 4, 12);
            ctx.fillRect(2, 6, 12, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(7, 4, 2, 8);
            ctx.fillRect(4, 7, 8, 2);
        }

        if (pattern === 'pod') {
            ctx.fillStyle = '#0c4a6e';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(2, 1, 12, 3);
            ctx.fillRect(2, 12, 12, 3);
            ctx.fillStyle = '#0ea5e9';
            ctx.fillRect(2, 4, 12, 8);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(4, 5, 8, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(6, 6, 4, 4);
        }

        if (pattern === 'gas') {
            ctx.fillStyle = '#365314';
            ctx.fillRect(2, 2, 6, 6);
            ctx.fillRect(8, 8, 6, 6);
            ctx.fillStyle = '#84cc16';
            ctx.fillRect(3, 3, 4, 4);
            ctx.fillRect(9, 9, 4, 4);
            ctx.fillStyle = '#ecfccb';
            ctx.fillRect(4, 4, 2, 2);
            ctx.fillRect(10, 10, 2, 2);
        }

        if (pattern === 'lava') {
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(2, 3, 12, 10);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(3, 5, 10, 6);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(5, 6, 6, 4);
        }

        if (pattern === 'boulder') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(0, 0, 3, 3);
            ctx.fillRect(13, 0, 3, 3);
            ctx.fillRect(0, 13, 3, 3);
            ctx.fillRect(13, 13, 3, 3);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(3, 2, 10, 3);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(4, 7, 8, 2);
            ctx.fillRect(7, 4, 2, 8);
        }

        if (pattern === 'station') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(0, 0, 16, 3);
            ctx.fillRect(0, 13, 16, 3);
            ctx.fillStyle = '#f59e0b';
            for (let i = 0; i < 16; i += 4) {
                ctx.fillRect(i, 6, 2, 4);
            }
        }

        if (pattern === 'steel') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#475569';
            ctx.fillRect(1, 1, 14, 3);
            ctx.fillRect(1, 12, 14, 3);
            for (let i = 2; i < 14; i += 4) {
                ctx.fillRect(i, 4, 2, 8);
            }
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(2, 2, 2, 1);
            ctx.fillRect(12, 2, 2, 1);
            ctx.fillRect(2, 13, 2, 1);
            ctx.fillRect(12, 13, 2, 1);
        }

        if (pattern === 'ruins') {
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#312e81';
            ctx.fillRect(1, 1, 6, 6);
            ctx.fillRect(8, 1, 7, 6);
            ctx.fillRect(1, 8, 9, 7);
            ctx.fillRect(11, 8, 4, 7);
            ctx.fillStyle = '#818cf8';
            ctx.fillRect(4, 4, 8, 2);
            ctx.fillRect(7, 2, 2, 12);
            ctx.fillStyle = '#c7d2fe';
            ctx.fillRect(7, 7, 2, 2);
        }

        if (pattern === 'crate') {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(2, 7, 12, 2);
            ctx.fillRect(7, 2, 2, 12);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(5, 5, 6, 6);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(6, 6, 4, 4);
        }

        if (pattern === 'chrono') {
            ctx.fillStyle = '#082f49';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(3, 3, 10, 10);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(5, 2, 6, 12);
            ctx.fillRect(2, 5, 12, 6);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(6, 4, 4, 8);
            ctx.fillRect(4, 6, 8, 4);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(7, 7, 2, 2);
        }

        if (pattern === 'medkit') {
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#ecfdf5';
            ctx.fillRect(2, 2, 12, 12);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(6, 3, 4, 10);
            ctx.fillRect(3, 6, 10, 4);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(7, 4, 2, 8);
        }

        if (pattern === 'relic') {
            ctx.fillStyle = '#3b0764';
            ctx.fillRect(1, 1, 14, 14);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(3, 3, 10, 10);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(6, 1, 4, 14);
            ctx.fillRect(1, 6, 14, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(6, 6, 4, 4);
        }

        return c;
    }
}
