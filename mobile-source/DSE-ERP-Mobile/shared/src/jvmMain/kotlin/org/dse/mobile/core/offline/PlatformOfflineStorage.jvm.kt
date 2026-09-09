package org.dse.mobile.core.offline

import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.prefs.Preferences

/**
 * JVM/IntelliJ durable storage.
 *
 * java.util.prefs.Preferences limits an individual value to MAX_VALUE_LENGTH
 * (8192 chars on the JDK). ERP auth snapshots, cached register payloads and the
 * offline outbox can legitimately exceed that size, so v1.0.2 stores values as
 * fixed-size chunks under a SHA-256 keyed child node.
 *
 * Reads retain compatibility with the original v1 Preferences layout so users
 * do not lose previously persisted small values during upgrade.
 */
private val legacyPrefs: Preferences = Preferences.userRoot().node("org/dse/erp/mobile/offline")
private val chunkRoot: Preferences = Preferences.userRoot().node("org/dse/erp/mobile/offline-v2")
private const val CHUNK_SIZE = 6_000
private const val COUNT_KEY = "count"
private const val CHUNK_PREFIX = "chunk."

actual fun platformOfflineRead(key: String): String? {
    val nodeName = storageNodeName(key)
    val chunked = runCatching {
        if (!chunkRoot.nodeExists(nodeName)) return@runCatching null
        val node = chunkRoot.node(nodeName)
        val count = node.getInt(COUNT_KEY, -1)
        if (count < 0) return@runCatching null
        buildString {
            repeat(count) { index ->
                val chunk = node.get("$CHUNK_PREFIX$index", null) ?: return@runCatching null
                append(chunk)
            }
        }
    }.getOrNull()

    return chunked ?: runCatching { legacyPrefs.get(key, null) }.getOrNull()
}

actual fun platformOfflineWrite(key: String, value: String) {
    val node = chunkRoot.node(storageNodeName(key))
    runCatching { node.clear() }

    val chunks = if (value.isEmpty()) listOf("") else value.chunked(CHUNK_SIZE)
    node.putInt(COUNT_KEY, chunks.size)
    chunks.forEachIndexed { index, chunk -> node.put("$CHUNK_PREFIX$index", chunk) }
    node.flush()

    // A successful v2 write supersedes any small value created by v1.
    runCatching {
        legacyPrefs.remove(key)
        legacyPrefs.flush()
    }
}

actual fun platformOfflineRemove(key: String) {
    val nodeName = storageNodeName(key)
    runCatching {
        if (chunkRoot.nodeExists(nodeName)) {
            chunkRoot.node(nodeName).removeNode()
            chunkRoot.flush()
        }
    }
    runCatching {
        legacyPrefs.remove(key)
        legacyPrefs.flush()
    }
}

actual fun platformOfflineNowMillis(): Long = System.currentTimeMillis()

private fun storageNodeName(key: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(key.toByteArray(StandardCharsets.UTF_8))
    return digest.joinToString("") { byte -> "%02x".format(byte.toInt() and 0xff) }
}
