package org.dse.mobile.core.model
import kotlinx.serialization.Serializable
@Serializable data class MobileDashboard(val salesToday:Double=0.0,val receivables:Double=0.0,val purchaseToday:Double=0.0,val payables:Double=0.0,val bankBalance:Double=0.0,val expenseMonth:Double=0.0,val pendingReconcile:Long=0,val readyToShip:Long=0)
@Serializable data class ShippingDraft(val id:Long?=null,val invoiceNo:String="",val customer:String="",val address:String="",val transporter:String="",val vehicleNo:String="",val lrNo:String="",val trackingNo:String="",val status:String="READY",val dispatchDate:String?=null,val deliveredAt:String?=null,val rowVersion:Long=0)
enum class SyncState { IDLE,SYNCING,ONLINE,OFFLINE,CONFLICT }
data class PermissionGate(val permissions:Set<String>){ fun allows(code:String)=permissions.contains("*")||permissions.contains(code) }
