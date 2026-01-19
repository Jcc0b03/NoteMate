import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return "przed chwilą";
    if (diffMin < 60) return `${diffMin} min temu`;
    if (diffHour < 24) return `${diffHour} godz. temu`;
    if (diffDay === 1) return "wczoraj";
    if (diffDay < 7) return `${diffDay} dni temu`;

    return past.toLocaleDateString('pl-PL');
}

export function getColorForSubject(subject: string | null): string {
    if (!subject) return "blue";

    const colors = ["blue", "green", "orange", "purple"];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
