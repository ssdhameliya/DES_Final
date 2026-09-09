package org.dse.mobile.core.api

/** M0 in-memory contract. M1 iOS implementation will persist tokens in Keychain. */
interface SessionStore {
    fun accessToken(): String?
    fun saveAccessToken(token: String?)
    fun clear()
}

class InMemorySessionStore : SessionStore {
    private var token: String? = null
    override fun accessToken(): String? = token
    override fun saveAccessToken(token: String?) { this.token = token }
    override fun clear() { token = null }
}
