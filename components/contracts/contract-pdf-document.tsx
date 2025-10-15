import React from "react"
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"

// Register Arabic font
Font.register({
  family: "Cairo",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hGA-W1ToLQ-HmkA.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hOA_W1ToLQ-HmkA.ttf",
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Cairo",
    direction: "rtl",
  },
  header: {
    backgroundColor: "#667eea",
    padding: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  contractInfo: {
    marginBottom: 15,
    textAlign: "right",
  },
  contractNumber: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textAlign: "right",
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    textAlign: "right",
    lineHeight: 1.5,
  },
  textBold: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 5,
    textAlign: "right",
  },
  textGray: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
    textAlign: "right",
  },
  serviceBox: {
    border: "2 solid #667eea",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  term: {
    fontSize: 9,
    marginBottom: 5,
    textAlign: "right",
    lineHeight: 1.6,
  },
  signatureSection: {
    marginTop: 20,
    marginBottom: 15,
  },
  signatureBox: {
    marginBottom: 20,
  },
  signatureImage: {
    width: 150,
    height: 60,
    marginBottom: 5,
    alignSelf: "flex-end",
  },
  signatureLine: {
    borderBottom: "1 solid #d1d5db",
    width: 150,
    marginBottom: 5,
    alignSelf: "flex-end",
  },
  idCardSection: {
    marginTop: 20,
  },
  idCardImage: {
    width: 200,
    height: 120,
    marginBottom: 10,
    alignSelf: "flex-end",
    border: "1 solid #e5e7eb",
    borderRadius: 5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
})

interface ContractPDFProps {
  contractNumber: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceType: string
  packageName: string
  totalAmount: number
  depositAmount: number
  remainingAmount: number
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

export function ContractPDFDocument(props: ContractPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Roboweb</Text>
          <Text style={styles.headerSubtitle}>عقد تقديم خدمات تقنية</Text>
        </View>

        {/* Contract Info */}
        <View style={styles.contractInfo}>
          <Text style={styles.contractNumber}>رقم العقد: {props.contractNumber}</Text>
          <Text style={styles.textGray}>
            التاريخ: {new Date(props.createdAt).toLocaleDateString("ar-SA")}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أطراف العقد:</Text>
          
          <Text style={styles.textBold}>الطرف الأول: شركة روبوويب للحلول التقنية</Text>
          <Text style={styles.textGray}>السجل التجاري: 1234567890</Text>
          <Text style={styles.textGray}>البريد الإلكتروني: info@roboweb.sa</Text>
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.textBold}>الطرف الثاني: {props.clientName}</Text>
            <Text style={styles.textGray}>البريد الإلكتروني: {props.clientEmail}</Text>
            <Text style={styles.textGray}>رقم الجوال: {props.clientPhone}</Text>
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الخدمة:</Text>
          <View style={styles.serviceBox}>
            <Text style={styles.text}>نوع الخدمة: {props.serviceType}</Text>
            <Text style={styles.text}>الباقة: {props.packageName}</Text>
            <Text style={styles.text}>
              المبلغ الإجمالي: {props.totalAmount.toLocaleString("ar-SA")} ر.س
            </Text>
            <Text style={styles.text}>
              العربون المدفوع: {props.depositAmount.toLocaleString("ar-SA")} ر.س
            </Text>
            <Text style={styles.text}>
              المبلغ المتبقي: {props.remainingAmount.toLocaleString("ar-SA")} ر.س
            </Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>شروط وأحكام العقد:</Text>
          {props.contractTerms.terms.map((term, index) => (
            <Text key={index} style={styles.term}>
              {index + 1}. {term}
            </Text>
          ))}
          
          {props.contractTerms.notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.textBold}>ملاحظات إضافية:</Text>
              <Text style={styles.term}>{props.contractTerms.notes}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>التوقيعات:</Text>
          
          {/* Admin Signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.textBold}>توقيع الطرف الأول (Roboweb):</Text>
            {props.adminSignature ? (
              <>
                <Image src={props.adminSignature} style={styles.signatureImage} />
                <Text style={styles.textGray}>
                  التاريخ: {new Date(props.adminSignatureDate!).toLocaleDateString("ar-SA")}
                </Text>
                {props.adminSignedBy && (
                  <Text style={styles.textGray}>الموقع: {props.adminSignedBy}</Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.textGray}>(في انتظار التوقيع)</Text>
              </>
            )}
          </View>

          {/* Client Signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.textBold}>توقيع الطرف الثاني ({props.clientName}):</Text>
            {props.clientSignature ? (
              <>
                <Image src={props.clientSignature} style={styles.signatureImage} />
                <Text style={styles.textGray}>
                  التاريخ: {new Date(props.clientSignatureDate!).toLocaleDateString("ar-SA")}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.signatureLine} />
                <Text style={styles.textGray}>(في انتظار التوقيع)</Text>
              </>
            )}
          </View>
        </View>

        {/* ID Cards - Only show if both signatures are present */}
        {props.adminSignature && props.clientSignature && (
          <View style={styles.idCardSection}>
            <Text style={styles.sectionTitle}>صور البطاقات:</Text>
            
            {/* Admin ID Card */}
            {props.adminIdCard && (
              <View style={styles.signatureBox}>
                <Text style={styles.textBold}>بطاقة المسؤول:</Text>
                <Image src={props.adminIdCard} style={styles.idCardImage} />
              </View>
            )}

            {/* Client ID Card */}
            {props.clientIdCard ? (
              <View style={styles.signatureBox}>
                <Text style={styles.textBold}>بطاقة العميل:</Text>
                <Image src={props.clientIdCard} style={styles.idCardImage} />
              </View>
            ) : (
              <View style={styles.signatureBox}>
                <Text style={styles.textBold}>بطاقة العميل:</Text>
                <Text style={styles.textGray}>(في انتظار رفع البطاقة)</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>© 2025 Roboweb. جميع الحقوق محفوظة.</Text>
        </View>
      </Page>
    </Document>
  )
}
