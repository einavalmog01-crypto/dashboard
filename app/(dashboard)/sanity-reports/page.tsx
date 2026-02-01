"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getReports } from "@/lib/sanity-reports"
import { Badge } from "@/components/ui/badge"
import jsPDF from "jspdf"
import "jspdf-autotable"

export default function SanityReportsPage() {
  const reports = getReports()

  function downloadJSON(report: any) {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.type}_Sanity_${report.createdAt}.json`
    a.click()
  }

  function downloadPDF(report: any) {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Sanity Report - ${report.type}`, 14, 20)
    doc.setFontSize(12)
    doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`, 14, 28)

    doc.autoTable({
      startY: 36,
      head: [["Test Name", "Status", "Comment"]],
      body: report.tests.map((t: any) => [
        t.testName || t.name,
        t.status,
        t.error || "-",
      ]),
      headStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 1) {
          if (data.cell.raw === "PASS") data.cell.styles.textColor = [0, 128, 0]
          if (data.cell.raw === "FAILED") data.cell.styles.textColor = [220, 0, 0]
        }
      },
      styles: { cellPadding: 2, fontSize: 10 },
    })

    doc.save(`${report.type}_Sanity_${report.createdAt}.pdf`)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sanity Reports</h1>

      {reports.length === 0 && (
        <p className="text-muted-foreground">
          No sanity reports yet
        </p>
      )}

      <div className="space-y-3">
        {reports.map((report) => {
          const label = `${
            report.type === "FULL" ? "Full Sanity" : "Basic Sanity"
          } — ${new Date(report.createdAt).toLocaleString()}`

          const passed = report.tests.filter((t: any) => t.status === "PASS").length
          const failed = report.tests.filter((t: any) => t.status === "FAILED").length

          const commentsPreview = report.tests
            .filter((t: any) => t.error || t.comment)
            .slice(0, 2)
            .map((t: any) => `• ${t.testName || t.name}: ${t.error || t.comment}`)
            .join("\n")
          
          return (
            <Card key={report.id} className="hover:bg-muted">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">{label}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-green-600 text-black">PASS {passed}</Badge>
                    <Badge className="bg-red-600 text-white">FAILED {failed}</Badge>
                  </div>
                  {commentsPreview && (
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground mt-1">
                      {commentsPreview}
                    </pre>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Link
                    href={`/sanity-reports/${report.id}`}
                    target="_blank"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => downloadJSON(report)}
                    className="text-sm text-white bg-primary px-2 py-1 rounded hover:bg-primary/80"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => downloadPDF(report)}
                    className="text-sm text-white bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                  >
                    PDF
                  </button>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
