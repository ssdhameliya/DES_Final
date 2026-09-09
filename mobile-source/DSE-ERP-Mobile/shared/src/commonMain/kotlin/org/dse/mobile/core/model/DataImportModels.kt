package org.dse.mobile.core.model

import kotlinx.serialization.Serializable

@Serializable data class LookupImportDto(
    val id:Int?=null,val lookupType:String="",val lookupCode:String="",val lookupValue:String="",
    val description:String?=null,val displayOrder:Int=0,val active:Boolean=true,val rowVersion:Long=0
)
@Serializable data class CategoryUpsertRequest(val code:String,val name:String,val description:String?=null)
@Serializable data class CategoryImportDto(
    val id:Int?=null,val categoryCode:String="",val categoryName:String="",val description:String?=null,
    val displayOrder:Int=0,val active:Boolean=true,val valueCount:Long=0,val activeValueCount:Long=0,val rowVersion:Long=0
)

@Serializable data class BankImportRow(
    val sourceRowNumber:Int?=null,val transactionTimestamp:String="",val transactionDate:String="",val valueDate:String="",
    val description:String="",val reference:String="",val debit:Double=0.0,val credit:Double=0.0,val balance:Double=0.0,
    val transactionFingerprint:String=""
)
@Serializable data class BankImportRequest(
    val bankName:String="",val bankAccount:String="",val accountHolder:String="",val statementFrom:String="",val statementTo:String="",
    val currency:String="INR",val openingBalance:Double?=null,val closingBalance:Double?=null,val sourceFingerprint:String="",
    val sourceFileName:String="",val sourceCsv:String="",val importedBy:String="Mobile",val dryRun:Boolean=true,val rows:List<BankImportRow> = emptyList()
)
@Serializable data class BankImportResult(val batch:BankBatch?=null,val importedRows:Int=0,val duplicateRows:Int=0,val alreadyImported:Boolean=false)

@Serializable data class PurchaseReconImportRow(
    val sourceSheet:String="Mobile",val sourceRow:Int?=null,val supplierName:String="",val supplierGstin:String="",
    val supplierInvoiceNo:String="",val invoiceDate:String="",val taxableValue:Double=0.0,val cgst:Double=0.0,val sgst:Double=0.0,val igst:Double=0.0,val invoiceValue:Double=0.0
)
@Serializable data class PurchaseReconImportRequest(
    val sourceFileName:String="",val sourceFingerprint:String="",val importNote:String="",val dryRun:Boolean=true,
    val rows:List<PurchaseReconImportRow> = emptyList()
)
@Serializable data class PurchaseReconImportRowResult(
    val sourceSheet:String="",val sourceRow:Int?=null,val status:String="",val action:String="",val supplierName:String="",
    val supplierReference:String="",val invoiceNo:String="",val message:String="",val warning:Boolean=false
)
@Serializable data class PurchaseReconImportResult(
    val totalRows:Int=0,val importedRows:Int=0,val updatedRows:Int=0,val alreadyCurrentRows:Int=0,val newSuppliers:Int=0,
    val existingSuppliers:Int=0,val duplicateRows:Int=0,val conflictRows:Int=0,val warningRows:Int=0,val ignoredRows:Int=0,
    val details:List<PurchaseReconImportRowResult> = emptyList()
)

data class ImportSheet(val fileName:String,val sheetName:String="Sheet1",val headers:List<String> = emptyList(),val rows:List<Map<String,String>> = emptyList(),val rawCsv:String="",val platformNotice:String="")
data class ImportExecutionSummary(val processed:Int=0,val succeeded:Int=0,val failed:Int=0,val messages:List<String> = emptyList())
