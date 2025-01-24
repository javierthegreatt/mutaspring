// Length of 23: 10 Neurons * 2 (w and b) + 3 for RGB
export function generateGen(length = 23) {
    return Array.from({ length }, () => Math.random());
}

export function crossGens(a, b) {
    const result = [];
    for(let i = 0; i < a.length; i++) {
        result.push(Math.random() > 0.5 ? a[i] : b[i]);
    }
    return result;
}

export function mutateGen(gene, chance = 0.05) {
    const p = 1 - chance;
    return gene.map(g => Math.random() >= p ? Math.random() : g);
}