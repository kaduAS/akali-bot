export function ts(date: Date | null | undefined, style: 'R' | 'F' | 'f' | 'd' = 'R'): string {
	if (!date) return 'unknown';
	return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
}

export function progressBar(current: number, total: number, size = 12): string {
	const ratio = total === 0 ? 0 : Math.min(1, current / total);
	const filled = Math.round(ratio * size);
	return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}

export function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
