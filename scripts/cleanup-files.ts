import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
    const { prisma } = await import("../src/lib/prisma");
    const { cleanupStoredFile } = await import("../src/lib/file-storage");
    try {
        const jobs = await prisma.blobDeletion.findMany({ orderBy: { createdAt: "asc" }, take: 100 });
        console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "dry-run", pending: jobs.length }));
        if (!process.argv.includes("--apply")) return;
        let cleaned = 0;
        for (const job of jobs) if (await cleanupStoredFile(job.url)) cleaned++;
        console.log(JSON.stringify({ cleaned, remainingInBatch: jobs.length - cleaned }));
        if (cleaned !== jobs.length) process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(() => { console.error("File cleanup failed"); process.exitCode = 1; });
