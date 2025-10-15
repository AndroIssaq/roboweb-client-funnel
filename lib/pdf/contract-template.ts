import jsPDF from "jspdf"

interface ContractData {
  contractNumber: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceType: string
  packageName: string
  totalAmount: number
  depositAmount: number
  remainingAmount: number
  paymentMethod: string
  contractTerms: {
    terms: string[]
    notes?: string
  }
  createdAt: string
  adminSignature?: string
  adminSignatureDate?: string
  adminSignedBy?: string
  clientSignature?: string
  clientSignatureDate?: string
}

export function generateContractPDF(data: ContractData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Set RTL support (Arabic)
  doc.setR2L(true)
  doc.setLanguage("ar")

  // Colors
  const primaryColor = [102, 126, 234] // #667eea
  const textColor = [31, 41, 55] // #1f2937
  const grayColor = [107, 114, 128] // #6b7280

  let yPos = 20

  // Header with gradient effect (simulated)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, "F")

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.text("Roboweb", 105, 20, { align: "center" })

  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.text("عقد تقديم خدمات تقنية", 105, 30, { align: "center" })

  yPos = 50

  // Contract number and date
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(`رقم العقد: ${data.contractNumber}`, 200, yPos, { align: "right" })
  yPos += 6
  doc.text(`التاريخ: ${new Date(data.createdAt).toLocaleDateString("ar-SA")}`, 200, yPos, { align: "right" })

  yPos += 15

  // Parties section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("أطراف العقد:", 200, yPos, { align: "right" })
  yPos += 10

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  // First party (Roboweb)
  doc.text("الطرف الأول: شركة روبوويب للحلول التقنية", 200, yPos, { align: "right" })
  yPos += 6
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text("السجل التجاري: 1234567890", 195, yPos, { align: "right" })
  yPos += 5
  doc.text("البريد الإلكتروني: info@roboweb.sa", 195, yPos, { align: "right" })

  yPos += 12

  // Second party (Client)
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(11)
  doc.text(`الطرف الثاني: ${data.clientName}`, 200, yPos, { align: "right" })
  yPos += 6
  doc.setFontSize(10)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(`البريد الإلكتروني: ${data.clientEmail}`, 195, yPos, { align: "right" })
  yPos += 5
  doc.text(`رقم الجوال: ${data.clientPhone}`, 195, yPos, { align: "right" })

  yPos += 15

  // Service details section
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("تفاصيل الخدمة:", 200, yPos, { align: "right" })
  yPos += 10

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  // Service info box
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPos - 5, 180, 35, 3, 3, "S")

  doc.text(`نوع الخدمة: ${data.serviceType}`, 190, yPos, { align: "right" })
  yPos += 7
  doc.text(`الباقة: ${data.packageName}`, 190, yPos, { align: "right" })
  yPos += 7
  doc.text(`المبلغ الإجمالي: ${data.totalAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })
  yPos += 7
  doc.text(`العربون المدفوع: ${data.depositAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })
  yPos += 7
  doc.text(`المبلغ المتبقي: ${data.remainingAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })

  yPos += 15

  // Terms and conditions
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("شروط وأحكام العقد:", 200, yPos, { align: "right" })
  yPos += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  data.contractTerms.terms.forEach((term, index) => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    const termText = `${index + 1}. ${term}`
    const lines = doc.splitTextToSize(termText, 170)
    lines.forEach((line: string) => {
      doc.text(line, 195, yPos, { align: "right" })
      yPos += 6
    })
    yPos += 2
  })

  // Additional notes
  if (data.contractTerms.notes) {
    yPos += 5
    doc.setFont("helvetica", "bold")
    doc.text("ملاحظات إضافية:", 200, yPos, { align: "right" })
    yPos += 7
    doc.setFont("helvetica", "normal")
    const notesLines = doc.splitTextToSize(data.contractTerms.notes, 170)
    notesLines.forEach((line: string) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.text(line, 195, yPos, { align: "right" })
      yPos += 6
    })
  }

  // Check if we need a new page for signatures
  if (yPos > 200) {
    doc.addPage()
    yPos = 20
  } else {
    yPos += 20
  }

  // Signatures section
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("التوقيعات:", 200, yPos, { align: "right" })
  yPos += 15

  // Admin signature
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("توقيع الطرف الأول (Roboweb):", 200, yPos, { align: "right" })
  yPos += 5

  if (data.adminSignature) {
    // Add signature image
    try {
      doc.addImage(data.adminSignature, "PNG", 140, yPos, 50, 20)
    } catch (e) {
      console.error("Error adding admin signature:", e)
    }
    yPos += 22
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(`التاريخ: ${new Date(data.adminSignatureDate!).toLocaleDateString("ar-SA")}`, 190, yPos, {
      align: "right",
    })
    if (data.adminSignedBy) {
      yPos += 5
      doc.text(`الموقع: ${data.adminSignedBy}`, 190, yPos, { align: "right" })
    }
  } else {
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(140, yPos + 15, 190, yPos + 15)
    yPos += 17
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text("(في انتظار التوقيع)", 165, yPos, { align: "center" })
  }

  yPos += 15

  // Client signature
  doc.setTextColor(textColor[0], textColor[1], textColor[2])
  doc.setFontSize(11)
  doc.text(`توقيع الطرف الثاني (${data.clientName}):`, 200, yPos, { align: "right" })
  yPos += 5

  if (data.clientSignature) {
    // Add signature image
    try {
      doc.addImage(data.clientSignature, "PNG", 140, yPos, 50, 20)
    } catch (e) {
      console.error("Error adding client signature:", e)
    }
    yPos += 22
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(`التاريخ: ${new Date(data.clientSignatureDate!).toLocaleDateString("ar-SA")}`, 190, yPos, {
      align: "right",
    })
  } else {
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(140, yPos + 15, 190, yPos + 15)
    yPos += 17
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text("(في انتظار التوقيع)", 165, yPos, { align: "center" })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(`صفحة ${i} من ${pageCount}`, 105, 285, { align: "center" })
    doc.text("© 2025 Roboweb. جميع الحقوق محفوظة.", 105, 290, { align: "center" })
  }

  return doc
}

export function downloadContractPDF(data: ContractData, filename?: string) {
  const doc = generateContractPDF(data)
  doc.save(filename || `contract-${data.contractNumber}.pdf`)
}

export function getContractPDFBlob(data: ContractData): Blob {
  const doc = generateContractPDF(data)
  return doc.output("blob")
}

export function getContractPDFBase64(data: ContractData): string {
  const doc = generateContractPDF(data)
  return doc.output("dataurlstring")
}
