package org.dse.mobile.core.offline

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlatformOfflineStorageJvmTest {
    @Test
    fun largeOfflineValueRoundTripsBeyondJavaPreferencesLimit() {
        val key = "test.large.${System.nanoTime()}"
        val value = buildString {
            repeat(120_000) { index -> append(('a'.code + (index % 26)).toChar()) }
        }

        try {
            platformOfflineWrite(key, value)
            assertEquals(value, platformOfflineRead(key))
        } finally {
            platformOfflineRemove(key)
        }
        assertNull(platformOfflineRead(key))
    }
}
