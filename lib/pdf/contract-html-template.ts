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

export function generateContractHTML(data: ContractData): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد خدمات - ${data.contractNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #1f2937;
            background: white;
            font-size: 14px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        
        .header p {
            font-size: 18px;
            font-weight: 400;
        }
        
        .contract-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-right: 4px solid #667eea;
        }
        
        .contract-info h2 {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            font-size: 14px;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .party {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .party h3 {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .party-details {
            font-size: 14px;
            line-height: 1.8;
        }
        
        .party-details strong {
            color: #374151;
        }
        
        .service-box {
            background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .service-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #c7d2fe;
        }
        
        .service-item:last-child {
            border-bottom: none;
        }
        
        .service-label {
            font-weight: 600;
            color: #374151;
        }
        
        .service-value {
            font-weight: 700;
            color: #667eea;
        }
        
        .terms-list {
            list-style: none;
            counter-reset: term-counter;
        }
        
        .terms-list li {
            counter-increment: term-counter;
            margin-bottom: 12px;
            padding-right: 25px;
            position: relative;
            line-height: 1.7;
        }
        
        .terms-list li::before {
            content: counter(term-counter, arabic-indic) ".";
            position: absolute;
            right: 0;
            font-weight: 600;
            color: #667eea;
        }
        
        .notes {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
        }
        
        .notes h4 {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 40px 0;
        }
        
        .signature-box {
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            background: #fafafa;
        }
        
        .signature-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #374151;
        }
        
        .signature-image {
            max-width: 200px;
            max-height: 80px;
            margin: 15px auto;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            background: white;
            padding: 10px;
        }
        
        .signature-placeholder {
            height: 80px;
            border: 2px dashed #d1d5db;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-style: italic;
            margin: 15px 0;
        }
        
        .signature-date {
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
        }
        
        .id-cards {
            margin-top: 40px;
        }
        
        .id-cards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }
        
        .id-card-box {
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            background: #fafafa;
        }
        
        .id-card-image {
            max-width: 100%;
            max-height: 150px;
            margin: 15px auto;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
        }
        
        .id-card-placeholder {
            height: 150px;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-style: italic;
            margin: 15px 0;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                font-size: 12px;
            }
            .container {
                padding: 0;
            }
            .header {
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Roboweb</h1>
            <p>عقد تقديم خدمات تقنية</p>
        </div>

        <!-- Contract Info -->
        <div class="contract-info">
            <h2>معلومات العقد</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">رقم العقد:</span> ${data.contractNumber}
                </div>
                <div class="info-item">
                    <span class="info-label">التاريخ:</span> ${new Date(data.createdAt).toLocaleDateString('ar-SA')}
                </div>
            </div>
        </div>

        <!-- Parties -->
        <div class="section">
            <h2 class="section-title">أطراف العقد</h2>
            <div class="parties">
                <div class="party">
                    <h3>الطرف الأول</h3>
                    <div class="party-details">
                        <strong>شركة روبوويب للحلول التقنية</strong><br>
                        السجل التجاري: 1234567890<br>
                        البريد الإلكتروني: info@roboweb.sa<br>
                        الهاتف: +966501234567
                    </div>
                </div>
                <div class="party">
                    <h3>الطرف الثاني</h3>
                    <div class="party-details">
                        <strong>${data.clientName}</strong><br>
                        البريد الإلكتروني: ${data.clientEmail}<br>
                        رقم الجوال: ${data.clientPhone}
                    </div>
                </div>
            </div>
        </div>

        <!-- Service Details -->
        <div class="section">
            <h2 class="section-title">تفاصيل الخدمة</h2>
            <div class="service-box">
                <div class="service-grid">
                    <div class="service-item">
                        <span class="service-label">نوع الخدمة:</span>
                        <span class="service-value">${data.serviceType}</span>
                    </div>
                    <div class="service-item">
                        <span class="service-label">الباقة:</span>
                        <span class="service-value">${data.packageName}</span>
                    </div>
                    <div class="service-item">
                        <span class="service-label">المبلغ الإجمالي:</span>
                        <span class="service-value">${data.totalAmount.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div class="service-item">
                        <span class="service-label">العربون المدفوع:</span>
                        <span class="service-value">${data.depositAmount.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div class="service-item">
                        <span class="service-label">المبلغ المتبقي:</span>
                        <span class="service-value">${data.remainingAmount.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div class="service-item">
                        <span class="service-label">طريقة الدفع:</span>
                        <span class="service-value">${data.paymentMethod}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Terms -->
        <div class="section">
            <h2 class="section-title">شروط وأحكام العقد</h2>
            <ul class="terms-list">
                ${data.contractTerms.terms.map(term => `<li>${term}</li>`).join('')}
            </ul>
            
            ${data.contractTerms.notes ? `
                <div class="notes">
                    <h4>ملاحظات إضافية:</h4>
                    <p>${data.contractTerms.notes}</p>
                </div>
            ` : ''}
        </div>

        <!-- Signatures -->
        <div class="section">
            <h2 class="section-title">التوقيعات</h2>
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-title">توقيع الطرف الأول (Roboweb)</div>
                    ${data.adminSignature ? `
                        <img src="${data.adminSignature}" alt="Admin Signature" class="signature-image">
                        <div class="signature-date">
                            التاريخ: ${new Date(data.adminSignatureDate!).toLocaleDateString('ar-SA')}
                            ${data.adminSignedBy ? `<br>الموقع: ${data.adminSignedBy}` : ''}
                        </div>
                    ` : `
                        <div class="signature-placeholder">في انتظار التوقيع</div>
                    `}
                </div>
                
                <div class="signature-box">
                    <div class="signature-title">توقيع الطرف الثاني (${data.clientName})</div>
                    ${data.clientSignature ? `
                        <img src="${data.clientSignature}" alt="Client Signature" class="signature-image">
                        <div class="signature-date">
                            التاريخ: ${new Date(data.clientSignatureDate!).toLocaleDateString('ar-SA')}
                        </div>
                    ` : `
                        <div class="signature-placeholder">في انتظار التوقيع</div>
                    `}
                </div>
            </div>
        </div>

        <!-- ID Cards (only if both signatures exist) -->
        ${data.adminSignature && data.clientSignature ? `
            <div class="section id-cards">
                <h2 class="section-title">صور البطاقات الشخصية</h2>
                <div class="id-cards-grid">
                    <div class="id-card-box">
                        <div class="signature-title">بطاقة المسؤول</div>
                        ${data.adminIdCard ? `
                            <img src="${data.adminIdCard}" alt="Admin ID Card" class="id-card-image">
                        ` : `
                            <div class="id-card-placeholder">لم يتم رفع البطاقة</div>
                        `}
                    </div>
                    
                    <div class="id-card-box">
                        <div class="signature-title">بطاقة العميل</div>
                        ${data.clientIdCard ? `
                            <img src="${data.clientIdCard}" alt="Client ID Card" class="id-card-image">
                        ` : `
                            <div class="id-card-placeholder">في انتظار رفع البطاقة</div>
                        `}
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>© 2025 Roboweb. جميع الحقوق محفوظة.</p>
            <p>هذا العقد محمي بموجب القوانين السعودية</p>
        </div>
    </div>
</body>
</html>
  `
}
