package org.dse.mobile.core.api

import io.ktor.client.engine.HttpClientEngine

expect fun platformHttpClientEngine(): HttpClientEngine
