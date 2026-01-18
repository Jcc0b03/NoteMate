export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
    return (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">{value}</span>
                    {trend && <span className="text-xs text-green-600 font-medium bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
                </div>
            </div>
        </div>
    );
}
