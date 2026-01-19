import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai";

export async function processNoteBackground(noteId: string) {
  console.log(`Starting background processing for note ${noteId}`);
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { files: true }
  });

  if (!note) {
      console.error(`Note ${noteId} not found during processing`);
      return;
  }

  try {
    const provider = getAIProvider();

    // Convert DB files to required format
    const filesToProcess = note.files.map(f => ({
        url: f.url,
        mimeType: f.type
    }));

    if (filesToProcess.length === 0) {
        // Nothing to process
        await prisma.note.update({
            where: { id: noteId },
            data: { status: "COMPLETED", content: "", summary: "Brak plików do analizy." }
        });
        return;
    }

    const result = await provider.processNote(filesToProcess);

    await prisma.note.update({
      where: { id: noteId },
      data: {
        content: result.content,
        summary: result.summary,
        status: "COMPLETED"
      }
    });
    console.log(`Note ${noteId} processed successfully`);
  } catch (error) {
    console.error(`Processing failed for note ${noteId}`, error);
    await prisma.note.update({
      where: { id: noteId },
      data: { status: "FAILED" }
    });
  }
}
