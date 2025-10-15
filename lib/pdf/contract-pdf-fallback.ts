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

export async function downloadContractPDFFallback(data: ContractData, filename?: string) {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Set font (use built-in font for Arabic compatibility)
    pdf.setFont('helvetica')
    
    let yPos = 20

    // Header
    pdf.setFillColor(102, 126, 234) // #667eea
    pdf.rect(0, 0, 210, 40, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.text('Roboweb', 105, 20, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text('Contract for Technical Services', 105, 30, { align: 'center' })

    yPos = 50

    // Contract Info
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    pdf.text(`Contract Number: ${data.contractNumber}`, 20, yPos)
    yPos += 10
    pdf.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 20, yPos)
    yPos += 20

    // Parties
    pdf.setFontSize(16)
    pdf.text('Contract Parties:', 20, yPos)
    yPos += 15

    pdf.setFontSize(12)
    pdf.text('First Party: Roboweb Technical Solutions', 20, yPos)
    yPos += 8
    pdf.text('Commercial Registration: 1234567890', 25, yPos)
    yPos += 8
    pdf.text('Email: info@roboweb.sa', 25, yPos)
    yPos += 15

    pdf.text(`Second Party: ${data.clientName}`, 20, yPos)
    yPos += 8
    pdf.text(`Email: ${data.clientEmail}`, 25, yPos)
    yPos += 8
    pdf.text(`Phone: ${data.clientPhone}`, 25, yPos)
    yPos += 20

    // Service Details
    pdf.setFontSize(16)
    pdf.text('Service Details:', 20, yPos)
    yPos += 15

    pdf.setFontSize(12)
    pdf.text(`Service Type: ${data.serviceType}`, 20, yPos)
    yPos += 8
    pdf.text(`Package: ${data.packageName}`, 20, yPos)
    yPos += 8
    pdf.text(`Total Amount: ${data.totalAmount.toLocaleString()} SAR`, 20, yPos)
    yPos += 8
    pdf.text(`Deposit: ${data.depositAmount.toLocaleString()} SAR`, 20, yPos)
    yPos += 8
    pdf.text(`Remaining: ${data.remainingAmount.toLocaleString()} SAR`, 20, yPos)
    yPos += 8
    pdf.text(`Payment Method: ${data.paymentMethod}`, 20, yPos)
    yPos += 20

    // Terms
    if (yPos > 250) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(16)
    pdf.text('Terms and Conditions:', 20, yPos)
    yPos += 15

    pdf.setFontSize(10)
    data.contractTerms.terms.forEach((term, index) => {
      if (yPos > 270) {
        pdf.addPage()
        yPos = 20
      }
      
      const termText = `${index + 1}. ${term}`
      const lines = pdf.splitTextToSize(termText, 170)
      
      lines.forEach((line: string) => {
        pdf.text(line, 20, yPos)
        yPos += 6
      })
      yPos += 3
    })

    if (data.contractTerms.notes) {
      yPos += 10
      pdf.setFontSize(12)
      pdf.text('Additional Notes:', 20, yPos)
      yPos += 8
      pdf.setFontSize(10)
      const notesLines = pdf.splitTextToSize(data.contractTerms.notes, 170)
      notesLines.forEach((line: string) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(line, 20, yPos)
        yPos += 6
      })
    }

    // Signatures
    if (yPos > 200) {
      pdf.addPage()
      yPos = 20
    } else {
      yPos += 20
    }

    pdf.setFontSize(16)
    pdf.text('Signatures:', 20, yPos)
    yPos += 20

    // Admin Signature
    pdf.setFontSize(12)
    pdf.text('First Party Signature (Roboweb):', 20, yPos)
    yPos += 10

    if (data.adminSignature) {
      try {
        pdf.addImage(data.adminSignature, 'PNG', 20, yPos, 60, 25)
        yPos += 30
        pdf.setFontSize(10)
        pdf.text(`Date: ${new Date(data.adminSignatureDate!).toLocaleDateString()}`, 20, yPos)
        if (data.adminSignedBy) {
          yPos += 6
          pdf.text(`Signed by: ${data.adminSignedBy}`, 20, yPos)
        }
      } catch (e) {
        pdf.text('(Signature image could not be loaded)', 20, yPos)
        yPos += 10
      }
    } else {
      pdf.line(20, yPos + 10, 80, yPos + 10)
      yPos += 15
      pdf.setFontSize(10)
      pdf.text('(Pending signature)', 20, yPos)
    }

    yPos += 20

    // Client Signature
    pdf.setFontSize(12)
    pdf.text(`Second Party Signature (${data.clientName}):`, 20, yPos)
    yPos += 10

    if (data.clientSignature) {
      try {
        pdf.addImage(data.clientSignature, 'PNG', 20, yPos, 60, 25)
        yPos += 30
        pdf.setFontSize(10)
        pdf.text(`Date: ${new Date(data.clientSignatureDate!).toLocaleDateString()}`, 20, yPos)
      } catch (e) {
        pdf.text('(Signature image could not be loaded)', 20, yPos)
        yPos += 10
      }
    } else {
      pdf.line(20, yPos + 10, 80, yPos + 10)
      yPos += 15
      pdf.setFontSize(10)
      pdf.text('(Pending signature)', 20, yPos)
    }

    // ID Cards (if both signatures exist)
    if (data.adminSignature && data.clientSignature) {
      if (yPos > 200) {
        pdf.addPage()
        yPos = 20
      } else {
        yPos += 30
      }

      pdf.setFontSize(16)
      pdf.text('ID Cards:', 20, yPos)
      yPos += 20

      // Admin ID Card
      pdf.setFontSize(12)
      pdf.text('Admin ID Card:', 20, yPos)
      yPos += 10

      if (data.adminIdCard) {
        try {
          pdf.addImage(data.adminIdCard, 'JPEG', 20, yPos, 80, 50)
          yPos += 55
        } catch (e) {
          pdf.text('(ID card image could not be loaded)', 20, yPos)
          yPos += 10
        }
      } else {
        pdf.text('(ID card not uploaded)', 20, yPos)
        yPos += 10
      }

      yPos += 10

      // Client ID Card
      pdf.setFontSize(12)
      pdf.text('Client ID Card:', 20, yPos)
      yPos += 10

      if (data.clientIdCard) {
        try {
          pdf.addImage(data.clientIdCard, 'JPEG', 20, yPos, 80, 50)
        } catch (e) {
          pdf.text('(ID card image could not be loaded)', 20, yPos)
        }
      } else {
        pdf.text('(Pending ID card upload)', 20, yPos)
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' })
      pdf.text('© 2025 Roboweb. All rights reserved.', 105, 290, { align: 'center' })
    }

    // Download
    pdf.save(filename || `contract-${data.contractNumber}.pdf`)
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    throw new Error('فشل في إنشاء ملف PDF')
  }
}
