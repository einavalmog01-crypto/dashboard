"use client";
import { useEffect, useState } from "react";
export default function EvidencePreview({ itemId }: { itemId: string }) {
  const [files, setFiles] = useState<string[]>([]);
  const [jsonData, setJsonData] = useState<any>(null);
useEffect(() => {
    fetch(`/api/evidence/${itemId}`)
      .then(res => res.json())
      .then(setFiles);
  }, [itemId]);
async function loadJson(file: string) {
    const res = await fetch(`/evidence/${itemId}/${file}`);
    setJsonData(await res.json());
  }
return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {files.map(file => {
        if (file.endsWith(".png") || file.endsWith(".jpg")) {
          return (
            <img
              key={file}
              src={`/evidence/${itemId}/${file}`}
              className="rounded border"
            />
          );
        }
if (file.endsWith(".json")) {
          return (
            <button
              key={file}
              onClick={() => loadJson(file)}
              className="border p-2 rounded text-left"
            >
              📄 {file}
            </button>
          );
        }
return (
          <a
            key={file}
            href={`/evidence/${itemId}/${file}`}
            download
            className="border p-2 rounded block"
          >
            ⬇ {file}
          </a>
        );
      })}
{jsonData && (
        <pre className="col-span-full bg-black text-green-400 p-4 rounded overflow-auto">
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )}
    </div>
  );
}
