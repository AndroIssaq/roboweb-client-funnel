"use client"

import { getPdfMake } from "./pdfmake-loader"

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

async function toDataUrl(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined
  try {
    // If already a data URL
    if (url.startsWith("data:")) return url
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return undefined
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return undefined
  }
}

export async function downloadContractPDFMake(data: ContractData, filename?: string) {
  const pdfMake = await getPdfMake()

  const adminSignDataUrl = await toDataUrl(data.adminSignature)
  const clientSignDataUrl = await toDataUrl(data.clientSignature)
  const adminIdDataUrl = await toDataUrl(data.adminIdCard)
  const clientIdDataUrl = await toDataUrl(data.clientIdCard)

  // Convert numbers to Arabic-Indic numerals with proper formatting
  const arNum = (n: number) => {
    const arabicNums = n.toLocaleString("ar-EG")
    return arabicNums
  }
  
  const arMoney = (n: number) => {
    const arabicNums = n.toLocaleString("ar-EG")
    return `${arabicNums} ج.م`
  }
  
  // Reverse Arabic-Indic number sequences if they appear reversed
  const fixArabicNumbers = (text: string): string => {
    // Arabic-Indic digits: ٠١٢٣٤٥٦٧٨٩
    const arabicDigitPattern = /[\u0660-\u0669]+/g
    
    return text.replace(arabicDigitPattern, (match) => {
      // If the number is part of a larger reversed text, it might need reversing
      // For now, keep numbers as-is since they should be displayed correctly
      return match
    })
  }

  // Reverse Arabic text word order for pdfmake (which doesn't support RTL)
  const fixArabicText = (text: string): string => {
    if (!text) return text
    
    // Check if text contains Arabic
    const arabicPattern = /[\u0600-\u06FF]/
    const arabicDigitPattern = /[\u0660-\u0669]/
    
    if (!arabicPattern.test(text) && !arabicDigitPattern.test(text)) return text
    
    // Split text into words while preserving spaces
    const words = text.split(/\s+/)
    const reversedWords: string[] = []
    
    // Reverse only if text contains Arabic letters (not just numbers)
    if (arabicPattern.test(text)) {
      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i]
        
        // Check if word is purely Latin/English or numbers - keep it in place relatively
        const isLatinWord = /^[a-zA-Z0-9@._\-+()]+$/.test(word)
        
        if (isLatinWord) {
          // For Latin words in Arabic context, we might need special handling
          reversedWords.push(word)
        } else {
          reversedWords.push(word)
        }
      }
    } else {
      // If only numbers, don't reverse
      return text
    }
    
    // Join with single space
    let reversed = reversedWords.join(' ')
    
    // Clean up spacing around punctuation
    reversed = reversed.replace(/\s*:\s*/g, ' : ')
                       .replace(/\s*،\s*/g, ' ، ')
                       .replace(/\s+/g, ' ')
                       .trim()
    
    console.log(`Fixed Arabic text: "${text}" -> "${reversed}"`)
    return reversed
  }

  // Brand palette
  const colors = {
    mint: "#10b981", // mint green
    black: "#000000",
    white: "#ffffff",
    mintTint: "#ecfdf5", // very light mint for rows
    border: "#e5e7eb",
  }

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 80, 40, 60],
    defaultStyle: {
      font: "Cairo",
      fontSize: 12,
      color: colors.black,
      lineHeight: 1.7,
      characterSpacing: 0.3,
    },
    info: {
      title: 'Roboweb Contract',
      author: 'Roboweb',
      subject: 'Service Contract',
    },
    styles: {
      brandTitle: { 
        fontSize: 24, 
        bold: true, 
        color: colors.white, 
        alignment: "center", 
        margin: [0, 10, 0, 5] 
      },
      brandSubtitle: { 
        fontSize: 14, 
        bold: false, 
        color: colors.white, 
        alignment: "center", 
        margin: [0, 0, 0, 15] 
      },
      sectionTitle: { 
        fontSize: 16, 
        bold: true, 
        color: colors.black, 
        margin: [0, 25, 0, 15], 
        alignment: "right"
      },
      label: { 
        bold: true, 
        color: colors.black, 
        alignment: "right",
        margin: [0, 3, 0, 3]
      },
      smallMuted: { 
        fontSize: 11, 
        color: colors.black, 
        alignment: "right",
        margin: [0, 2, 0, 2]
      },
      contractInfo: { 
        fontSize: 12, 
        alignment: "right", 
        margin: [0, 3, 0, 3]
      },
      partyTitle: { 
        fontSize: 13, 
        bold: true, 
        color: colors.mint, 
        margin: [0, 0, 0, 10], 
        alignment: "right"
      },
      partyContent: { 
        fontSize: 12, 
        alignment: "right", 
        margin: [0, 3, 0, 3]
      },
      cell: { 
        margin: [8, 8, 8, 8]
      },
    },
    header: {
      margin: [0, 0, 0, 20],
      table: {
        widths: ["*"],
        body: [
          [ { text: "Roboweb", style: "brandTitle", fillColor: colors.mint } ],
          [ { text: fixArabicText("عقد تقديم خدمات تقنية"), style: "brandSubtitle", fillColor: colors.mint } ],
        ],
      },
      layout: "noBorders",
    },
    content: [

      // Contract info section with proper RTL
      {
        columns: [
          { 
            width: "*", 
            text: fixArabicText(`رقم العقد: ${data.contractNumber}`), 
            style: "contractInfo",
            alignment: "right"
          },
          { 
            width: "*", 
            text: fixArabicText(`التاريخ: ${new Date(data.createdAt).toLocaleDateString("ar-SA")}`), 
            style: "contractInfo",
            alignment: "left"
          },
        ],
        margin: [0, 0, 0, 16],
      },

      { text: fixArabicText("أطراف العقد"), style: "sectionTitle" },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: fixArabicText("الطرف الأول"), style: "partyTitle" },
              { text: fixArabicText("شركة روبوويب للحلول التقنية"), style: "partyContent" },
              { text: fixArabicText("السجل التجاري: ١٢٣٤٥٦٧٨٩٠"), style: "smallMuted" },
              { text: fixArabicText("البريد الإلكتروني: info@roboweb.sa"), style: "smallMuted" },
              { text: fixArabicText("الهاتف: +٩٦٦٥٠١٢٣٤٥٦٧"), style: "smallMuted" },
            ],
            margin: [0, 0, 16, 16],
          },
          {
            width: "*",
            stack: [
              { text: fixArabicText("الطرف الثاني"), style: "partyTitle" },
              { text: fixArabicText(data.clientName), style: "partyContent" },
              { text: fixArabicText(`البريد الإلكتروني: ${data.clientEmail}`), style: "smallMuted" },
              { text: fixArabicText(`رقم الجوال: ${data.clientPhone}`), style: "smallMuted" },
            ],
            margin: [16, 0, 0, 16],
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 20],
      },

      { text: fixArabicText("تفاصيل الخدمة"), style: "sectionTitle" },
      {
        table: {
          widths: [140, "*"],
          body: [
            [ 
              { 
                text: fixArabicText("نوع الخدمة"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(data.serviceType), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
            [ 
              { 
                text: fixArabicText("الباقة"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(data.packageName), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
            [ 
              { 
                text: fixArabicText("المبلغ الإجمالي"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(arMoney(data.totalAmount)), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
            [ 
              { 
                text: fixArabicText("العربون المدفوع"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(arMoney(data.depositAmount)), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
            [ 
              { 
                text: fixArabicText("المبلغ المتبقي"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(arMoney(data.remainingAmount)), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
            [ 
              { 
                text: fixArabicText("طريقة الدفع"), 
                style: "label", 
                margin: [10, 8, 10, 8],
                alignment: "right"
              }, 
              { 
                text: fixArabicText(data.paymentMethod), 
                alignment: "right", 
                margin: [10, 8, 10, 8]
              } 
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? colors.mintTint : undefined),
          hLineColor: colors.border,
          vLineColor: colors.border,
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 20],
      },

      { text: fixArabicText("شروط وأحكام العقد"), style: "sectionTitle" },
      {
        table: {
          widths: [30, "*"],
          body: (
            (data.contractTerms.terms || []).map((t, i) => [
              { 
                text: `${arNum(i + 1)}.`, 
                color: colors.mint, 
                bold: true, 
                alignment: "center",
                margin: [6, 10, 6, 10],
                fontSize: 12
              },
              { 
                text: fixArabicText(t), 
                alignment: "right",
                margin: [12, 10, 12, 10],
                lineHeight: 1.5
              }
            ])
          )
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? colors.mintTint : undefined),
          hLineColor: colors.border,
          vLineColor: () => "transparent",
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 20],
      },
      data.contractTerms.notes
        ? { 
            text: fixArabicText(`ملاحظات إضافية: ${data.contractTerms.notes}`), 
            margin: [0, 10, 0, 20], 
            color: colors.black,
            alignment: "right",
            fontSize: 10
          }
        : {},

      // بند الدفعة المقدمة المقفول
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  {
                    text: fixArabicText("⚠️ شروط الدفعة المقدمة (بند مقفول - غير قابل للتعديل)"),
                    bold: true,
                    color: colors.mint,
                    fontSize: 13,
                    alignment: "center",
                    margin: [0, 0, 0, 10]
                  },
                  {
                    text: fixArabicText(`• الدفعة المقدمة: ${arMoney(data.depositAmount)} (50% من قيمة الباقة)`),
                    alignment: "right",
                    margin: [10, 5, 10, 5]
                  },
                  {
                    text: fixArabicText(`• المبلغ المتبقي: ${arMoney(data.remainingAmount)} (يُسدد عند التسليم)`),
                    alignment: "right",
                    margin: [10, 5, 10, 5]
                  },
                  {
                    text: fixArabicText("• الدفعة المقدمة غير قابلة للاسترجاع بعد بدء العمل"),
                    alignment: "right",
                    margin: [10, 5, 10, 5],
                    bold: true,
                    color: "#ef4444"
                  },
                  {
                    text: fixArabicText("• هذا البند مقفول ولا يمكن تعديله أو التفاوض عليه"),
                    alignment: "right",
                    margin: [10, 5, 10, 10],
                    bold: true,
                    color: "#ef4444"
                  }
                ],
                fillColor: "#fef3c7"
              }
            ]
          ]
        },
        layout: {
          hLineColor: colors.mint,
          vLineColor: colors.mint,
          hLineWidth: () => 2,
          vLineWidth: () => 2,
          paddingTop: () => 12,
          paddingBottom: () => 12,
          paddingLeft: () => 12,
          paddingRight: () => 12
        },
        margin: [0, 0, 0, 25]
      },

      { text: fixArabicText("التوقيعات"), style: "sectionTitle" },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: fixArabicText("توقيع الطرف الأول (Roboweb)"), style: "label", alignment: "center", margin: [0, 0, 0, 8] },
              adminSignDataUrl
                ? { image: adminSignDataUrl, fit: [220, 80], margin: [0, 8, 0, 4], alignment: "center" }
                : { text: fixArabicText("في انتظار التوقيع"), style: "smallMuted", margin: [0, 24, 0, 0], alignment: "center" },
              data.adminSignatureDate
                ? { text: fixArabicText(`التاريخ: ${new Date(data.adminSignatureDate).toLocaleDateString("ar-SA")}`), style: "smallMuted", alignment: "center" }
                : {},
              data.adminSignedBy
                ? { text: fixArabicText(`الموقع: ${data.adminSignedBy}`), style: "smallMuted", alignment: "center" }
                : {},
            ],
            margin: [0, 0, 10, 0],
          },
          {
            width: "*",
            stack: [
              { text: fixArabicText(`توقيع الطرف الثاني (${data.clientName})`), style: "label", alignment: "center", margin: [0, 0, 0, 8] },
              clientSignDataUrl
                ? { image: clientSignDataUrl, fit: [220, 80], margin: [0, 8, 0, 4], alignment: "center" }
                : { text: fixArabicText("في انتظار التوقيع"), style: "smallMuted", margin: [0, 24, 0, 0], alignment: "center" },
              data.clientSignatureDate
                ? { text: fixArabicText(`التاريخ: ${new Date(data.clientSignatureDate).toLocaleDateString("ar-SA")}`), style: "smallMuted", alignment: "center" }
                : {},
            ],
            margin: [10, 0, 0, 0],
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 20],
      },

      (adminIdDataUrl || clientIdDataUrl)
        ? { text: fixArabicText("صور البطاقات الشخصية"), style: "sectionTitle" }
        : {},
      (adminIdDataUrl || clientIdDataUrl)
        ? {
            columns: [
              {
                width: "*",
                stack: [
                  { text: fixArabicText("بطاقة المسؤول"), style: "label", alignment: "center" },
                  adminIdDataUrl
                    ? { image: adminIdDataUrl, fit: [240, 160], margin: [0, 8, 0, 0], alignment: "center" }
                    : { text: fixArabicText("لم يتم رفع البطاقة"), style: "smallMuted", alignment: "center", margin: [0, 30, 0, 0] },
                ],
              },
              {
                width: "*",
                stack: [
                  { text: fixArabicText("بطاقة العميل"), style: "label", alignment: "center" },
                  clientIdDataUrl
                    ? { image: clientIdDataUrl, fit: [240, 160], margin: [0, 8, 0, 0], alignment: "center" }
                    : { text: fixArabicText("في انتظار رفع البطاقة"), style: "smallMuted", alignment: "center", margin: [0, 30, 0, 0] },
                ],
              },
            ],
            columnGap: 16,
          }
        : {},
    ],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { 
          text: fixArabicText(`صفحة ${arNum(currentPage)} من ${arNum(pageCount)}`), 
          alignment: "center", 
          style: "smallMuted",
          fontSize: 10
        }
      ],
      margin: [0, 30, 0, 0],
    }),
  }

  // Pass fonts and vfs explicitly to ensure the same vfs used at runtime
  pdfMake.createPdf(docDefinition, undefined, pdfMake.fonts, pdfMake.vfs).download(
    filename || `contract-${data.contractNumber}.pdf`
  )
}
