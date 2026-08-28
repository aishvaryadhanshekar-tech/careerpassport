import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ingestFiles, kindFor, uid } from "../files";
import type { JobDraft } from "../types";

export function useAttachments({
  draftRef,
  setDraft,
  attachmentCount,
}: {
  draftRef: { current: JobDraft };
  setDraft: Dispatch<SetStateAction<JobDraft>>;
  attachmentCount: number;
}) {
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      draftRef.current.attachments.forEach((a) =>
        URL.revokeObjectURL(a.blobUrl),
      );
    };
  }, []);

  function addFiles(list: File[]) {
    const { accepted, errors } = ingestFiles(list, attachmentCount);
    setFileErrors(errors);
    if (!accepted.length) return;
    setDraft((d) => ({
      ...d,
      attachments: [
        ...d.attachments,
        ...accepted.map((file) => ({
          id: uid(),
          name: file.name,
          mime: file.type,
          sizeBytes: file.size,
          kind: kindFor(file),
          blobUrl: URL.createObjectURL(file),
        })),
      ],
    }));
  }

  function removeAttachment(id: string) {
    setDraft((d) => {
      const file = d.attachments.find((a) => a.id === id);
      if (file) URL.revokeObjectURL(file.blobUrl);
      return {
        ...d,
        attachments: d.attachments.filter((a) => a.id !== id),
      };
    });
  }

  return { fileErrors, addFiles, removeAttachment };
}
