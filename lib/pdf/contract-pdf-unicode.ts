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

export async function downloadContractPDFUnicode(data: ContractData, filename?: string) {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Use built-in font that supports Unicode better
    pdf.setFont('helvetica')
    
    let yPos = 20

    // Header
    pdf.setFillColor(102, 126, 234) // #667eea
    pdf.rect(0, 0, 210, 40, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.text('Roboweb', 105, 20, { align: 'center' })
    
    pdf.setFontSize(14)
    pdf.text('عقد تقديم خدمات تقنية', 105, 30, { align: 'center' })

    yPos = 50

    // Contract Info
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    pdf.text(`رقم العقد: ${data.contractNumber}`, 190, yPos, { align: 'right' })
    yPos += 8
    pdf.text(`التاريخ: ${new Date(data.createdAt).toLocaleDateString('ar-SA')}`, 190, yPos, { align: 'right' })
    yPos += 20

    // Parties
    pdf.setFontSize(16)
    pdf.text('أطراف العقد:', 190, yPos, { align: 'right' })
    yPos += 15

    pdf.setFontSize(12)
    pdf.text('الطرف الأول: شركة روبوويب للحلول التقنية', 190, yPos, { align: 'right' })
    yPos += 8
    pdf.setFontSize(10)
    pdf.text('السجل التجاري: 1234567890', 185, yPos, { align: 'right' })
    yPos += 6
    pdf.text('البريد الإلكتروني: info@roboweb.sa', 185, yPos, { align: 'right' })
    yPos += 15

    pdf.setFontSize(12)
    pdf.text(`الطرف الثاني: ${data.clientName}`, 190, yPos, { align: 'right' })
    yPos += 8
    pdf.setFontSize(10)
    pdf.text(`البريد الإلكتروني: ${data.clientEmail}`, 185, yPos, { align: 'right' })
    yPos += 6
    pdf.text(`رقم الجوال: ${data.clientPhone}`, 185, yPos, { align: 'right' })
    yPos += 20

    // Service Details
    pdf.setFontSize(16)
    pdf.text('تفاصيل الخدمة:', 190, yPos, { align: 'right' })
    yPos += 15

    // Service box
    pdf.setDrawColor(102, 126, 234)
    pdf.setLineWidth(1)
    pdf.rect(20, yPos - 5, 170, 40, 'S')

    pdf.setFontSize(11)
    pdf.text(`نوع الخدمة: ${data.serviceType}`, 185, yPos, { align: 'right' })
    yPos += 7
    pdf.text(`الباقة: ${data.packageName}`, 185, yPos, { align: 'right' })
    yPos += 7
    pdf.text(`المبلغ الإجمالي: ${data.totalAmount.toLocaleString('ar-SA')} ر.س`, 185, yPos, { align: 'right' })
    yPos += 7
    pdf.text(`العربون المدفوع: ${data.depositAmount.toLocaleString('ar-SA')} ر.س`, 185, yPos, { align: 'right' })
    yPos += 7
    pdf.text(`المبلغ المتبقي: ${data.remainingAmount.toLocaleString('ar-SA')} ر.س`, 185, yPos, { align: 'right' })
    yPos += 7
    pdf.text(`طريقة الدفع: ${data.paymentMethod}`, 185, yPos, { align: 'right' })
    yPos += 20

    // Terms
    if (yPos > 220) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(16)
    pdf.text('شروط وأحكام العقد:', 190, yPos, { align: 'right' })
    yPos += 15

    pdf.setFontSize(10)
    data.contractTerms.terms.forEach((term, index) => {
      if (yPos > 270) {
        pdf.addPage()
        yPos = 20
      }
      
      const termText = `${index + 1}. ${term}`
      const lines = pdf.splitTextToSize(termText, 160)
      
      lines.forEach((line: string) => {
        pdf.text(line, 185, yPos, { align: 'right' })
        yPos += 6
      })
      yPos += 3
    })

    if (data.contractTerms.notes) {
      yPos += 10
      pdf.setFontSize(12)
      pdf.text('ملاحظات إضافية:', 190, yPos, { align: 'right' })
      yPos += 8
      pdf.setFontSize(10)
      const notesLines = pdf.splitTextToSize(data.contractTerms.notes, 160)
      notesLines.forEach((line: string) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(line, 185, yPos, { align: 'right' })
        yPos += 6
      })
    }

    // Signatures
    if (yPos > 180) {
      pdf.addPage()
      yPos = 20
    } else {
      yPos += 20
    }

    pdf.setFontSize(16)
    pdf.text('التوقيعات:', 190, yPos, { align: 'right' })
    yPos += 20

    // Admin Signature
    pdf.setFontSize(12)
    pdf.text('توقيع الطرف الأول (Roboweb):', 190, yPos, { align: 'right' })
    yPos += 10

    if (data.adminSignature) {
      try {
        pdf.addImage(data.adminSignature, 'PNG', 120, yPos, 60, 25)
        yPos += 30
        pdf.setFontSize(10)
        pdf.text(`التاريخ: ${new Date(data.adminSignatureDate!).toLocaleDateString('ar-SA')}`, 185, yPos, { align: 'right' })
        if (data.adminSignedBy) {
          yPos += 6
          pdf.text(`الموقع: ${data.adminSignedBy}`, 185, yPos, { align: 'right' })
        }
      } catch (e) {
        pdf.text('(لم يتم تحميل صورة التوقيع)', 150, yPos, { align: 'center' })
        yPos += 10
      }
    } else {
      pdf.setDrawColor(200, 200, 200)
      pdf.line(120, yPos + 10, 180, yPos + 10)
      yPos += 15
      pdf.setFontSize(10)
      pdf.text('(في انتظار التوقيع)', 150, yPos, { align: 'center' })
    }

    yPos += 20

    // Client Signature
    pdf.setFontSize(12)
    pdf.text(`توقيع الطرف الثاني (${data.clientName}):`, 190, yPos, { align: 'right' })
    yPos += 10

    if (data.clientSignature) {
      try {
        pdf.addImage(data.clientSignature, 'PNG', 120, yPos, 60, 25)
        yPos += 30
        pdf.setFontSize(10)
        pdf.text(`التاريخ: ${new Date(data.clientSignatureDate!).toLocaleDateString('ar-SA')}`, 185, yPos, { align: 'right' })
      } catch (e) {
        pdf.text('(لم يتم تحميل صورة التوقيع)', 150, yPos, { align: 'center' })
        yPos += 10
      }
    } else {
      pdf.setDrawColor(200, 200, 200)
      pdf.line(120, yPos + 10, 180, yPos + 10)
      yPos += 15
      pdf.setFontSize(10)
      pdf.text('(في انتظار التوقيع)', 150, yPos, { align: 'center' })
    }

    // ID Cards (if both signatures exist)
    if (data.adminSignature && data.clientSignature) {
      if (yPos > 150) {
        pdf.addPage()
        yPos = 20
      } else {
        yPos += 30
      }

      pdf.setFontSize(16)
      pdf.text('صور البطاقات الشخصية:', 190, yPos, { align: 'right' })
      yPos += 20

      // Admin ID Card
      pdf.setFontSize(12)
      pdf.text('بطاقة المسؤول:', 190, yPos, { align: 'right' })
      yPos += 10

      if (data.adminIdCard) {
        try {
          pdf.addImage(data.adminIdCard, 'JPEG', 110, yPos, 80, 50)
          yPos += 55
        } catch (e) {
          pdf.text('(لم يتم تحميل صورة البطاقة)', 150, yPos, { align: 'center' })
          yPos += 10
        }
      } else {
        pdf.text('(لم يتم رفع البطاقة)', 150, yPos, { align: 'center' })
        yPos += 10
      }

      yPos += 10

      // Client ID Card
      pdf.setFontSize(12)
      pdf.text('بطاقة العميل:', 190, yPos, { align: 'right' })
      yPos += 10

      if (data.clientIdCard) {
        try {
          pdf.addImage(data.clientIdCard, 'JPEG', 110, yPos, 80, 50)
        } catch (e) {
          pdf.text('(لم يتم تحميل صورة البطاقة)', 150, yPos, { align: 'center' })
        }
      } else {
        pdf.text('(في انتظار رفع البطاقة)', 150, yPos, { align: 'center' })
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`صفحة ${i} من ${pageCount}`, 105, 285, { align: 'center' })
      pdf.text('© 2025 Roboweb. جميع الحقوق محفوظة.', 105, 290, { align: 'center' })
    }

    // Download
    pdf.save(filename || `contract-${data.contractNumber}.pdf`)
  } catch (error: any) {
    console.error('Error generating Unicode PDF:', error)
    throw new Error('فشل في إنشاء ملف PDF')
  }
}
