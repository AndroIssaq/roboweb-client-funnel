"use client"

import jsPDF from 'jspdf'

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
  adminIdCard?: string
  clientIdCard?: string
}

export async function downloadContractPDFArabic(data: ContractData, filename?: string) {
  try {
    // Create PDF with Arabic support
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Helper function for Arabic text
    const addArabicText = (text: string, x: number, y: number, options?: any) => {
      // Simple approach: use the text as-is, jsPDF should handle Unicode
      return pdf.text(text, x, y, options)
    }

    // Colors
    const primaryColor = [102, 126, 234] // #667eea
    const textColor = [31, 41, 55] // #1f2937
    const grayColor = [107, 114, 128] // #6b7280

    let yPos = 20

    // Header with gradient effect (simulated)
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.rect(0, 0, 210, 40, "F")

    // Company name
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont("helvetica", "bold")
    pdf.text("Roboweb", 105, 20, { align: "center" })

    pdf.setFontSize(14)
    pdf.setFont("helvetica", "normal")
    addArabicText("عقد تقديم خدمات تقنية", 105, 30, { align: "center" })

    yPos = 50

    // Contract number and date
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")
    addArabicText(`رقم العقد: ${data.contractNumber}`, 200, yPos, { align: "right" })
    yPos += 6
    addArabicText(`التاريخ: ${new Date(data.createdAt).toLocaleDateString("ar-SA")}`, 200, yPos, { align: "right" })

    yPos += 15

    // Parties section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    // @ts-ignore
    pdf.addArabicText("أطراف العقد:", 200, yPos, { align: "right" })
    yPos += 10

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // First party (Roboweb)
    // @ts-ignore
    pdf.addArabicText("الطرف الأول: شركة روبوويب للحلول التقنية", 200, yPos, { align: "right" })
    yPos += 6
    pdf.setFontSize(10)
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    pdf.text("السجل التجاري: 1234567890", 195, yPos, { align: "right" })
    yPos += 5
    pdf.text("البريد الإلكتروني: info@roboweb.sa", 195, yPos, { align: "right" })

    yPos += 12

    // Second party (Client)
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.setFontSize(11)
    // @ts-ignore
    pdf.addArabicText(`الطرف الثاني: ${data.clientName}`, 200, yPos, { align: "right" })
    yPos += 6
    pdf.setFontSize(10)
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    pdf.text(`البريد الإلكتروني: ${data.clientEmail}`, 195, yPos, { align: "right" })
    yPos += 5
    // @ts-ignore
    pdf.addArabicText(`رقم الجوال: ${data.clientPhone}`, 195, yPos, { align: "right" })

    yPos += 15

    // Service details section
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    // @ts-ignore
    pdf.addArabicText("تفاصيل الخدمة:", 200, yPos, { align: "right" })
    yPos += 10

    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")

    // Service info box
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    pdf.setLineWidth(0.5)
    pdf.roundedRect(15, yPos - 5, 180, 35, 3, 3, "S")

    // @ts-ignore
    pdf.addArabicText(`نوع الخدمة: ${data.serviceType}`, 190, yPos, { align: "right" })
    yPos += 7
    // @ts-ignore
    pdf.addArabicText(`الباقة: ${data.packageName}`, 190, yPos, { align: "right" })
    yPos += 7
    // @ts-ignore
    pdf.addArabicText(`المبلغ الإجمالي: ${data.totalAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })
    yPos += 7
    // @ts-ignore
    pdf.addArabicText(`العربون المدفوع: ${data.depositAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })
    yPos += 7
    // @ts-ignore
    pdf.addArabicText(`المبلغ المتبقي: ${data.remainingAmount.toLocaleString("ar-SA")} ر.س`, 190, yPos, { align: "right" })

    yPos += 15

    // Terms and conditions
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    // @ts-ignore
    pdf.addArabicText("شروط وأحكام العقد:", 200, yPos, { align: "right" })
    yPos += 10

    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")

    data.contractTerms.terms.forEach((term, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }

      const termText = `${index + 1}. ${term}`
      const lines = pdf.splitTextToSize(termText, 170)
      lines.forEach((line: string) => {
        // @ts-ignore
        pdf.addArabicText(line, 195, yPos, { align: "right" })
        yPos += 6
      })
      yPos += 2
    })

    // Additional notes
    if (data.contractTerms.notes) {
      yPos += 5
      pdf.setFont("helvetica", "bold")
      // @ts-ignore
      pdf.addArabicText("ملاحظات إضافية:", 200, yPos, { align: "right" })
      yPos += 7
      pdf.setFont("helvetica", "normal")
      const notesLines = pdf.splitTextToSize(data.contractTerms.notes, 170)
      notesLines.forEach((line: string) => {
        if (yPos > 250) {
          pdf.addPage()
          yPos = 20
        }
        // @ts-ignore
        pdf.addArabicText(line, 195, yPos, { align: "right" })
        yPos += 6
      })
    }

    // Check if we need a new page for signatures
    if (yPos > 200) {
      pdf.addPage()
      yPos = 20
    } else {
      yPos += 20
    }

    // Signatures section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    // @ts-ignore
    pdf.addArabicText("التوقيعات:", 200, yPos, { align: "right" })
    yPos += 15

    // Admin signature
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "normal")
    // @ts-ignore
    pdf.addArabicText("توقيع الطرف الأول (Roboweb):", 200, yPos, { align: "right" })
    yPos += 5

    if (data.adminSignature) {
      // Add signature image
      try {
        pdf.addImage(data.adminSignature, "PNG", 140, yPos, 50, 20)
      } catch (e) {
        console.error("Error adding admin signature:", e)
      }
      yPos += 22
      pdf.setFontSize(9)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      // @ts-ignore
      pdf.addArabicText(`التاريخ: ${new Date(data.adminSignatureDate!).toLocaleDateString("ar-SA")}`, 190, yPos, {
        align: "right",
      })
      if (data.adminSignedBy) {
        yPos += 5
        // @ts-ignore
        pdf.addArabicText(`الموقع: ${data.adminSignedBy}`, 190, yPos, { align: "right" })
      }
    } else {
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(140, yPos + 15, 190, yPos + 15)
      yPos += 17
      pdf.setFontSize(9)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      // @ts-ignore
      pdf.addArabicText("(في انتظار التوقيع)", 165, yPos, { align: "center" })
    }

    yPos += 15

    // Client signature
    pdf.setTextColor(textColor[0], textColor[1], textColor[2])
    pdf.setFontSize(11)
    // @ts-ignore
    pdf.addArabicText(`توقيع الطرف الثاني (${data.clientName}):`, 200, yPos, { align: "right" })
    yPos += 5

    if (data.clientSignature) {
      // Add signature image
      try {
        pdf.addImage(data.clientSignature, "PNG", 140, yPos, 50, 20)
      } catch (e) {
        console.error("Error adding client signature:", e)
      }
      yPos += 22
      pdf.setFontSize(9)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      // @ts-ignore
      pdf.addArabicText(`التاريخ: ${new Date(data.clientSignatureDate!).toLocaleDateString("ar-SA")}`, 190, yPos, {
        align: "right",
      })
    } else {
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(140, yPos + 15, 190, yPos + 15)
      yPos += 17
      pdf.setFontSize(9)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      // @ts-ignore
      pdf.addArabicText("(في انتظار التوقيع)", 165, yPos, { align: "center" })
    }

    // ID Cards section (only if both signatures exist)
    if (data.adminSignature && data.clientSignature) {
      // Check if we need a new page
      if (yPos > 150) {
        pdf.addPage()
        yPos = 20
      } else {
        yPos += 20
      }

      pdf.setTextColor(textColor[0], textColor[1], textColor[2])
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      // @ts-ignore
      pdf.addArabicText("صور البطاقات الشخصية:", 200, yPos, { align: "right" })
      yPos += 15

      // Admin ID Card
      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      // @ts-ignore
      pdf.addArabicText("بطاقة المسؤول:", 200, yPos, { align: "right" })
      yPos += 10

      if (data.adminIdCard) {
        try {
          pdf.addImage(data.adminIdCard, "JPEG", 120, yPos, 70, 45)
          yPos += 50
        } catch (e) {
          console.error("Error adding admin ID card:", e)
          // @ts-ignore
          pdf.addArabicText("(لم يتم تحميل صورة البطاقة)", 165, yPos, { align: "center" })
          yPos += 10
        }
      } else {
        // @ts-ignore
        pdf.addArabicText("(لم يتم رفع البطاقة)", 165, yPos, { align: "center" })
        yPos += 10
      }

      yPos += 10

      // Client ID Card
      // @ts-ignore
      pdf.addArabicText("بطاقة العميل:", 200, yPos, { align: "right" })
      yPos += 10

      if (data.clientIdCard) {
        try {
          pdf.addImage(data.clientIdCard, "JPEG", 120, yPos, 70, 45)
        } catch (e) {
          console.error("Error adding client ID card:", e)
          // @ts-ignore
          pdf.addArabicText("(لم يتم تحميل صورة البطاقة)", 165, yPos, { align: "center" })
        }
      } else {
        // @ts-ignore
        pdf.addArabicText("(في انتظار رفع البطاقة)", 165, yPos, { align: "center" })
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      // @ts-ignore
      pdf.addArabicText(`صفحة ${i} من ${pageCount}`, 105, 285, { align: "center" })
      pdf.text("© 2025 Roboweb. جميع الحقوق محفوظة.", 105, 290, { align: "center" })
    }

    // Download
    pdf.save(filename || `contract-${data.contractNumber}.pdf`)
  } catch (error: any) {
    console.error('Error generating Arabic PDF:', error)
    throw new Error('فشل في إنشاء ملف PDF')
  }
}
