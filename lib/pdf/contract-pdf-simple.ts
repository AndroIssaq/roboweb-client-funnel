"use client"

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

function createContractHTML(data: ContractData): string {
  return `
    <div style="
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      text-align: right;
      padding: 40px;
      background: #ffffff;
      width: 800px;
      margin: 0 auto;
      line-height: 1.6;
      color: #1a1a1a;
      box-sizing: border-box;
    ">
      <!-- Header -->
      <div style="
        background: #667eea;
        color: #ffffff;
        padding: 30px;
        text-align: center;
        border-radius: 10px;
        margin-bottom: 30px;
      ">
        <h1 style="font-size: 32px; margin: 0 0 10px 0; font-weight: bold; color: #ffffff;">Roboweb</h1>
        <p style="font-size: 18px; margin: 0; color: #ffffff;">عقد تقديم خدمات تقنية</p>
      </div>

      <!-- Contract Info -->
      <div style="
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 25px;
        border-right: 4px solid #667eea;
      ">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>رقم العقد:</strong> ${data.contractNumber}</div>
          <div><strong>التاريخ:</strong> ${new Date(data.createdAt).toLocaleDateString('ar-SA')}</div>
        </div>
      </div>

      <!-- Parties -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">أطراف العقد</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="font-size: 16px; font-weight: bold; color: #667eea; margin-bottom: 10px;">الطرف الأول</h3>
            <div style="font-size: 14px; line-height: 1.8;">
              <strong>شركة روبوويب للحلول التقنية</strong><br>
              السجل التجاري: 1234567890<br>
              البريد الإلكتروني: info@roboweb.sa<br>
              الهاتف: +966501234567
            </div>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="font-size: 16px; font-weight: bold; color: #667eea; margin-bottom: 10px;">الطرف الثاني</h3>
            <div style="font-size: 14px; line-height: 1.8;">
              <strong>${data.clientName}</strong><br>
              البريد الإلكتروني: ${data.clientEmail}<br>
              رقم الجوال: ${data.clientPhone}
            </div>
          </div>
        </div>
      </div>

      <!-- Service Details -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">تفاصيل الخدمة</h2>
        <div style="
          background: #f0f4ff;
          border: 2px solid #667eea;
          border-radius: 10px;
          padding: 25px;
        ">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
              <span style="font-weight: bold;">نوع الخدمة:</span>
              <span style="color: #667eea; font-weight: bold;">${data.serviceType}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
              <span style="font-weight: bold;">الباقة:</span>
              <span style="color: #667eea; font-weight: bold;">${data.packageName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
              <span style="font-weight: bold;">المبلغ الإجمالي:</span>
              <span style="color: #667eea; font-weight: bold;">${data.totalAmount.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #c7d2fe;">
              <span style="font-weight: bold;">العربون المدفوع:</span>
              <span style="color: #667eea; font-weight: bold;">${data.depositAmount.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: bold;">المبلغ المتبقي:</span>
              <span style="color: #667eea; font-weight: bold;">${data.remainingAmount.toLocaleString('ar-SA')} ر.س</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: bold;">طريقة الدفع:</span>
              <span style="color: #667eea; font-weight: bold;">${data.paymentMethod}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms -->
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">شروط وأحكام العقد</h2>
        <div style="margin-bottom: 12px;">
          ${data.contractTerms.terms.map((term, index) => `
            <div style="margin-bottom: 12px; padding-right: 25px; position: relative; line-height: 1.7;">
              <span style="position: absolute; right: 0; font-weight: bold; color: #667eea;">${index + 1}.</span>
              ${term}
            </div>
          `).join('')}
        </div>
        
        ${data.contractTerms.notes ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <h4 style="font-weight: bold; color: #92400e; margin-bottom: 8px;">ملاحظات إضافية:</h4>
            <p style="margin: 0;">${data.contractTerms.notes}</p>
          </div>
        ` : ''}
      </div>

      <!-- Signatures -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">التوقيعات</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; background: #fafafa;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">توقيع الطرف الأول (Roboweb)</div>
            ${data.adminSignature ? `
              <img src="${data.adminSignature}" style="max-width: 200px; max-height: 80px; margin: 15px auto; border: 1px solid #d1d5db; border-radius: 5px; background: white; padding: 10px;">
              <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                التاريخ: ${new Date(data.adminSignatureDate!).toLocaleDateString('ar-SA')}
                ${data.adminSignedBy ? `<br>الموقع: ${data.adminSignedBy}` : ''}
              </div>
            ` : `
              <div style="height: 80px; border: 2px dashed #d1d5db; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-style: italic; margin: 15px 0;">
                في انتظار التوقيع
              </div>
            `}
          </div>
          
          <div style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; background: #fafafa;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">توقيع الطرف الثاني (${data.clientName})</div>
            ${data.clientSignature ? `
              <img src="${data.clientSignature}" style="max-width: 200px; max-height: 80px; margin: 15px auto; border: 1px solid #d1d5db; border-radius: 5px; background: white; padding: 10px;">
              <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                التاريخ: ${new Date(data.clientSignatureDate!).toLocaleDateString('ar-SA')}
              </div>
            ` : `
              <div style="height: 80px; border: 2px dashed #d1d5db; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-style: italic; margin: 15px 0;">
                في انتظار التوقيع
              </div>
            `}
          </div>
        </div>
      </div>

      ${data.adminSignature && data.clientSignature ? `
        <!-- ID Cards -->
        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">صور البطاقات الشخصية</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; background: #fafafa;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">بطاقة المسؤول</div>
              ${data.adminIdCard ? `
                <img src="${data.adminIdCard}" style="max-width: 100%; max-height: 150px; margin: 15px auto; border: 1px solid #d1d5db; border-radius: 8px; background: white;">
              ` : `
                <div style="height: 150px; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-style: italic; margin: 15px 0;">
                  لم يتم رفع البطاقة
                </div>
              `}
            </div>
            
            <div style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; background: #fafafa;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">بطاقة العميل</div>
              ${data.clientIdCard ? `
                <img src="${data.clientIdCard}" style="max-width: 100%; max-height: 150px; margin: 15px auto; border: 1px solid #d1d5db; border-radius: 8px; background: white;">
              ` : `
                <div style="height: 150px; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-style: italic; margin: 15px 0;">
                  في انتظار رفع البطاقة
                </div>
              `}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p style="margin: 0 0 5px 0;">© 2025 Roboweb. جميع الحقوق محفوظة.</p>
        <p style="margin: 0;">هذا العقد محمي بموجب القوانين السعودية</p>
      </div>
    </div>
  `
}

export async function downloadContractPDFSimple(data: ContractData, filename?: string) {
  try {
    // Create temporary div
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = createContractHTML(data)
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '0'
    tempDiv.style.backgroundColor = '#ffffff'
    tempDiv.style.color = '#000000'
    document.body.appendChild(tempDiv)

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500))

    // Convert to canvas with safer options
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      logging: false,
      removeContainer: true,
      ignoreElements: (element) => {
        // Ignore elements that might cause issues
        return element.tagName === 'SCRIPT' || element.tagName === 'STYLE'
      }
    })

    // Remove temp div
    document.body.removeChild(tempDiv)

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Download
    pdf.save(filename || `contract-${data.contractNumber}.pdf`)
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    
    // More specific error messages
    if (error.message && error.message.includes('oklch')) {
      throw new Error('مشكلة في ألوان الصفحة - يرجى المحاولة مرة أخرى')
    } else if (error.message && error.message.includes('canvas')) {
      throw new Error('مشكلة في تحويل الصفحة - يرجى المحاولة مرة أخرى')
    } else if (error.message && error.message.includes('CORS')) {
      throw new Error('مشكلة في تحميل الصور - يرجى المحاولة مرة أخرى')
    } else {
      throw new Error('فشل في إنشاء ملف PDF - يرجى المحاولة مرة أخرى')
    }
  }
}
