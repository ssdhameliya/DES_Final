package org.dse.mobile.core.offline

expect fun platformOfflineRead(key: String): String?
expect fun platformOfflineWrite(key: String, value: String)
expect fun platformOfflineRemove(key: String)
expect fun platformOfflineNowMillis(): Long
