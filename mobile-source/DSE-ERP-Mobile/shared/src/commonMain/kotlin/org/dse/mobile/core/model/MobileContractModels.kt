package org.dse.mobile.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DashboardSnapshot(
    val generatedAt: String,
    val salesToday: Double = 0.0,
    val receivables: Double = 0.0,
    val purchasesToday: Double = 0.0,
    val payables: Double = 0.0,
    val bankBalance: Double = 0.0,
    val expensesToday: Double = 0.0,
    val pendingReconciliation: Long = 0,
)

@Serializable
enum class ChangeEntity {
    SALE,
    PURCHASE,
    FINANCE,
    QUOTATION,
    SALES_RETURN,
    PURCHASE_RETURN,
    SHIPPING,
}

@Serializable
enum class ChangeOperation { CREATED, UPDATED, DELETED }

@Serializable
data class SyncChange(
    val sequence: Long,
    val entity: ChangeEntity,
    val entityId: String,
    val operation: ChangeOperation,
    val rowVersion: Long? = null,
    val changedAt: String,
)

@Serializable
data class SyncPage(
    val cursor: Long,
    val hasMore: Boolean = false,
    val changes: List<SyncChange> = emptyList(),
)

@Serializable
enum class ShippingStatus {
    @SerialName("READY_TO_DISPATCH") READY_TO_DISPATCH,
    DISPATCHED,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED,
}

@Serializable
data class ShippingRecord(
    val id: Long? = null,
    val invoiceNo: String,
    val customer: String,
    val shippingAddress: String? = null,
    val transporter: String? = null,
    val vehicleNumber: String? = null,
    val lrAwbNo: String? = null,
    val contactPerson: String? = null,
    val contactMobile: String? = null,
    val dispatchDate: String? = null,
    val deliveredAt: String? = null,
    val status: ShippingStatus = ShippingStatus.READY_TO_DISPATCH,
    val notes: String? = null,
    val rowVersion: Long = 0,
)
