package org.dse.mobile.core.model

import kotlinx.serialization.Serializable

@Serializable
data class PartyRef(
    val id: Int? = null,
    val partyCode: String? = null,
    val name: String = "",
    val email: String? = null,
    val phone: String? = null,
    val gstin: String? = null,
    val address: String? = null,
)

@Serializable
data class DocumentLine(
    val itemCode: String = "",
    val itemDescription: String? = null,
    val itemHsn: String? = null,
    val itemUnit: String? = null,
    val itemRemarks: String? = null,
    val quantity: Double = 1.0,
    val rate: Double = 0.0,
    val discountPercent: Double = 0.0,
    val discountAmount: Double = 0.0,
    val gstPercent: Double = 0.0,
    val totalAmount: Double = 0.0,
)

@Serializable
data class DocumentCharge(
    val chargeType: String = "",
    val amount: Double = 0.0,
    val taxable: Boolean = false,
    val gstPercent: Double = 0.0,
)

@Serializable data class MetricPoint(val label:String="", val value:Double=0.0)
@Serializable data class RegisterTotals(val rows:Long=0,val total:Double=0.0,val paid:Double=0.0,val balance:Double=0.0)
@Serializable data class SalesMetrics(val totalSales:Double=0.0,val invoiceCount:Long=0,val todaySales:Double=0.0,val todayCount:Long=0,val pendingBalance:Double=0.0,val pendingCount:Long=0,val overdueBalance:Double=0.0,val overdueCount:Long=0,val dueSoonBalance:Double=0.0,val dueSoonCount:Long=0,val emailRate:Double=0.0,val dueBuckets:List<MetricPoint> = emptyList(),val topCustomers:List<MetricPoint> = emptyList(),val monthlySales:List<MetricPoint> = emptyList())
@Serializable data class PurchaseMetrics(val totalPurchases:Double=0.0,val activeDocuments:Long=0,val suppliers:Long=0,val itemQuantity:Double=0.0,val paidAmount:Double=0.0)

@Serializable
data class SaleRecord(
    val id:Int?=null,
    val invoiceNo:String="",
    val invoiceDate:String="",
    val customer:PartyRef?=null,
    val subtotal:Double=0.0,
    val discountAmount:Double=0.0,
    val gstAmount:Double=0.0,
    val totalAmount:Double=0.0,
    val remarks:String?=null,
    val createdAt:String?=null,
    val emailSent:Boolean=false,
    val dueDate:String?=null,
    val paidAmount:Double=0.0,
    val paymentStatus:String?=null,
    val whatsappSent:Boolean=false,
    val invoiceType:String?=null,
    val salesperson:String?=null,
    val source:String?=null,
    val notes:String?=null,
    val deliveryAddress:String?=null,
    val paymentTerms:String?=null,
    val transporter:String?=null,
    val referenceNo:String?=null,
    val poDate:String?=null,
    val billingAddress:String?=null,
    val gstType:String?=null,
    val doorDelivery:String?=null,
    val vehicleNumber:String?=null,
    val contactPerson:String?=null,
    val transportNote:String?=null,
    val orderNo:String?=null,
    val gstin:String?=null,
    val billingGstin:String?=null,
    val deliveryGstin:String?=null,
    val sameAsBilling:Boolean=false,
    val transporterGstin:String?=null,
    val chargeType:String?=null,
    val chargeAmount:Double=0.0,
    val contactPersonMobile:String?=null,
    val documentStatus:String?=null,
    val attachmentPath:String?=null,
    val quantity:Double=0.0,
    val charges:List<DocumentCharge> = emptyList(),
    val lines:List<DocumentLine> = emptyList(),
    val rowVersion:Long=0,
)

@Serializable
data class PurchaseRecord(
    val id:Int?=null,
    val invoiceNo:String="",
    val invoiceDate:String="",
    val supplier:PartyRef?=null,
    val subtotal:Double=0.0,
    val gstAmount:Double=0.0,
    val totalAmount:Double=0.0,
    val remarks:String?=null,
    val createdAt:String?=null,
    val emailSent:Boolean=false,
    val dueDate:String?=null,
    val paidAmount:Double=0.0,
    val paymentStatus:String?=null,
    val documentStatus:String?=null,
    val warehouse:String?=null,
    val paymentTerms:String?=null,
    val currency:String?=null,
    val referenceNo:String?=null,
    val gstTreatment:String?=null,
    val transporter:String?=null,
    val lrAwbNo:String?=null,
    val discountType:String?=null,
    val discountAmount:Double=0.0,
    val attachmentPath:String?=null,
    val createdBy:String?=null,
    val deliveryDate:String?=null,
    val billingAddress:String?=null,
    val deliveryAddress:String?=null,
    val billingGstin:String?=null,
    val deliveryGstin:String?=null,
    val gstType:String?=null,
    val transporterGstin:String?=null,
    val vehicleNumber:String?=null,
    val contactPerson:String?=null,
    val contactPersonMobile:String?=null,
    val notes:String?=null,
    val orderNo:String?=null,
    val poDate:String?=null,
    val sameAsBilling:Boolean=false,
    val quantity:Double=0.0,
    val charges:List<DocumentCharge> = emptyList(),
    val lines:List<DocumentLine> = emptyList(),
    val rowVersion:Long=0,
)

@Serializable
data class FinanceRecord(
    val id:Int?=null,
    val voucherNo:String="",
    val voucherType:String="",
    val voucherDate:String="",
    val partyId:Int?=null,
    val category:String?=null,
    val referenceNo:String?=null,
    val amount:Double=0.0,
    val paymentMode:String?=null,
    val notes:String?=null,
    val accountName:String?=null,
    val billPath:String?=null,
    val reconciled:Boolean=false,
    val statementTransactionId:Long?=null,
    val linkedTargetType:String?=null,
    val linkedTargetId:Int?=null,
    val linkedDocumentNo:String?=null,
    val rowVersion:Long=0,
)

@Serializable data class SalesPage(val rows:List<SaleRecord> = emptyList(),val page:Int=0,val size:Int=25,val totalRows:Long=0,val totalPages:Int=0,val filteredTotals:RegisterTotals?=null,val metrics:SalesMetrics?=null,val customers:List<String> = emptyList())
@Serializable data class PurchasePage(val rows:List<PurchaseRecord> = emptyList(),val page:Int=0,val size:Int=25,val totalRows:Long=0,val totalPages:Int=0,val filteredTotals:RegisterTotals?=null,val metrics:PurchaseMetrics?=null,val suppliers:List<String> = emptyList())
@Serializable data class FinancePage(val rows:List<FinanceRecord> = emptyList(),val page:Int=0,val size:Int=25,val totalRows:Long=0,val totalPages:Int=0)
@Serializable data class FinanceMetrics(val bankBalance:Double=0.0,val credits:Double=0.0,val debits:Double=0.0,val bankEntries:Long=0,val depositCount:Long=0,val withdrawalCount:Long=0,val expenseMonth:Double=0.0,val expenseYear:Double=0.0,val expenseEntries:Long=0,val topExpenseCategory:String?=null,val topExpenseAmount:Double=0.0,val pendingReconcile:Long=0,val pendingReconcileAmount:Double=0.0)

@Serializable
data class MasterParty(
    val id:Int?=null,val partyType:String="",val partyCode:String="",val name:String="",
    val contactPerson:String?=null,val phone:String?=null,val email:String?=null,val gstin:String?=null,
    val address:String?=null,val openingBalance:Double=0.0,val active:Boolean=true,val rowVersion:Long=0
)

@Serializable
data class MasterItem(
    val id:Int?=null,val itemCode:String="",val description:String="",val category:String?=null,val brand:String?=null,
    val material:String?=null,val size:String?=null,val unit:String?=null,val hsn:String?=null,val gst:Double=0.0,
    val discountPercent:Double=0.0,val purchasePrice:Double=0.0,val sellingPrice:Double=0.0,val openingStock:Double=0.0,
    val minimumStock:Double=0.0,val reservedStock:Double=0.0,val location:String?=null,val remarks:String?=null,
    val active:Boolean=true,val rowVersion:Long=0
)

@Serializable data class NextNumber(val value:String="")
