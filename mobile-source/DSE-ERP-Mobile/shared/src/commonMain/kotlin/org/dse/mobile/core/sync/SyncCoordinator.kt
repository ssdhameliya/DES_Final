package org.dse.mobile.core.sync
import org.dse.mobile.core.api.*
import org.dse.mobile.core.model.*
data class SyncStatus(val state:SyncState=SyncState.IDLE,val cursor:Long=0,val message:String="")
class SyncCoordinator(private val api:MobileApiV1){
 suspend fun pull(cursor:Long):Pair<SyncStatus,SyncPage?> = when(val r=api.sync(cursor)){
  is ApiResult.Success -> SyncStatus(SyncState.ONLINE,r.value.cursor,"Synced") to r.value
  is ApiResult.NotImplemented -> SyncStatus(SyncState.OFFLINE,cursor,r.message) to null
  is ApiResult.Conflict -> SyncStatus(SyncState.CONFLICT,cursor,r.message) to null
  else -> SyncStatus(SyncState.OFFLINE,cursor,r.toString()) to null
 }
}
