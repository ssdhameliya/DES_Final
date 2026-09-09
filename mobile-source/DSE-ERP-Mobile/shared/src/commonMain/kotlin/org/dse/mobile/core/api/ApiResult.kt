package org.dse.mobile.core.api

enum class ApiDataSource { LIVE, CACHE }

sealed interface ApiResult<out T> {
    data class Success<T>(val value: T, val source: ApiDataSource = ApiDataSource.LIVE, val cachedAtMillis: Long? = null) : ApiResult<T>
    data class Unauthorized(val message: String) : ApiResult<Nothing>
    data class Forbidden(val message: String) : ApiResult<Nothing>
    data class Conflict(val message: String) : ApiResult<Nothing>
    data class NotFound(val message: String) : ApiResult<Nothing>
    data class ServerError(val status: Int, val message: String) : ApiResult<Nothing>
    data class NetworkError(val message: String, val requestMayHaveReachedServer: Boolean = false) : ApiResult<Nothing>
    data class DecodeError(val message: String, val status: Int? = null) : ApiResult<Nothing>
    data class UnsafeEndpoint(val message: String) : ApiResult<Nothing>
    data class NotImplemented(val message: String) : ApiResult<Nothing>
}
