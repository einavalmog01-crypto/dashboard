"use client"

import { useRouter, useParams } from "next/navigation"
import { getReportById } from "@/lib/sanity-reports"
import jsPDF from "jspdf"
import "jspdf-autotable"

export default function SanityReportPage() {
  const router = useRouter()
  const { id } = useParams()
  const report = getReportById(id as string)

  if (!report) {
    return <div className="p-6">Report not found</div>
  }

  // JSON download (existing)
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${report.createdAt}.json`
    a.click()
  }

  // PDF download (new, with colors + comments)
  function downloadPDF() {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Sanity Report - ${report.type}`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`, 14, 28)

    // Table
    doc.autoTable({
      startY: 36,
      head: [["Test Name", "Status", "Comment"]],
      body: report.tests.map((t) => [
        t.testName,
        t.status,
        t.error || "-",
      ]),
      headStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          // Color-code PASS/FAIL in Status column
          if (data.cell.raw === "PASS") {
            data.cell.styles.textColor = [0, 128, 0] // green
          } else if (data.cell.raw === "FAILED") {
            data.cell.styles.textColor = [220, 0, 0] // red
          }
        }
      },
      styles: { cellPadding: 2, fontSize: 10 },
    })

    doc.save(`${report.type}_Sanity_${report.createdAt}.pdf`)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        {report.type === "FULL" ? "Full Sanity" : "Basic Sanity"} —{" "}
        {new Date(report.createdAt).toLocaleString()}
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Test Name</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Error</th>
          </tr>
        </thead>
        <tbody>
          {report.tests.map((t, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{t.testName}</td>
              <td
                className={`p-2 font-bold ${
                  t.status === "PASS"
                    ? "text-green-600"
                    : t.status === "FAILED"
                    ? "text-red-600"
                    : ""
                }`}
              >
                {t.status}
              </td>
              <td className="p-2 text-destructive">{t.error || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/sanity-reports")}
          className="px-4 py-2 border rounded"
        >
          Go Back
        </button>

        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Download JSON
        </button>

        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Download PDF
        </button>
      </div>
    </div>
  )
}
