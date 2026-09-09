@file:Suppress("CAST_NEVER_SUCCEEDS")

package org.dse.mobile.core.offline

import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSApplicationSupportDirectory
import platform.Foundation.NSDate
import platform.Foundation.NSFileManager
import platform.Foundation.NSFileProtectionCompleteUntilFirstUserAuthentication
import platform.Foundation.NSFileProtectionKey
import platform.Foundation.NSSearchPathForDirectoriesInDomains
import platform.Foundation.NSString
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.NSUserDomainMask
import platform.Foundation.create
import platform.Foundation.timeIntervalSince1970
import platform.Foundation.writeToFile

/**
 * Durable iOS ERP cache/outbox storage.
 *
 * Business payloads live under Application Support and are assigned iOS Data
 * Protection (CompleteUntilFirstUserAuthentication). This is intentionally
 * separate from credentials: the bearer token remains in Keychain. Values are
 * written atomically and each logical key maps to a collision-resistant file
 * name, so configured invoice/item separators cannot collide.
 */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
actual fun platformOfflineRead(key: String): String? = runCatching {
    val path = offlineFilePath(key)
    if (!NSFileManager.defaultManager.fileExistsAtPath(path)) return@runCatching null

    NSString.create(
        contentsOfFile = path,
        encoding = NSUTF8StringEncoding,
        error = null,
    ) as String
}.getOrNull()

@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
actual fun platformOfflineWrite(key: String, value: String) {
    runCatching {
        val path = offlineFilePath(key)

        val ok = NSString.create(string = value).writeToFile(
            path = path,
            atomically = true,
            encoding = NSUTF8StringEncoding,
            error = null,
        )
        if (!ok) error("Unable to persist protected ERP offline data")

        // Re-apply protection on replacement files as an explicit invariant.
        NSFileManager.defaultManager.setAttributes(
            mapOf(NSFileProtectionKey to NSFileProtectionCompleteUntilFirstUserAuthentication),
            ofItemAtPath = path,
            error = null,
        )
    }
}

@OptIn(ExperimentalForeignApi::class)
actual fun platformOfflineRemove(key: String) {
    runCatching {
        val path = offlineFilePath(key)
        if (NSFileManager.defaultManager.fileExistsAtPath(path)) {
            NSFileManager.defaultManager.removeItemAtPath(path, error = null)
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
actual fun platformOfflineNowMillis(): Long = (NSDate().timeIntervalSince1970 * 1000.0).toLong()

@OptIn(ExperimentalForeignApi::class)
private fun offlineFilePath(key: String): String = "${offlineDirectory()}/${stableFileKey(key)}.json"

@OptIn(ExperimentalForeignApi::class)
private fun offlineDirectory(): String {
    val base = NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, true)
        .firstOrNull() as? String
        ?: error("Application Support directory is unavailable")
    val directory = "$base/DSEERPMobile/Offline"
    val fm = NSFileManager.defaultManager
    if (!fm.fileExistsAtPath(directory)) {
        val created = fm.createDirectoryAtPath(
            directory,
            withIntermediateDirectories = true,
            attributes = mapOf(NSFileProtectionKey to NSFileProtectionCompleteUntilFirstUserAuthentication),
            error = null,
        )
        if (!created) error("Unable to create protected ERP offline directory")
    }
    return directory
}

private fun stableFileKey(value: String): String {
    var hash = -3750763034362895579L
    value.forEach { ch -> hash = hash xor ch.code.toLong(); hash *= 1099511628211L }
    return hash.toULong().toString(16)
}
