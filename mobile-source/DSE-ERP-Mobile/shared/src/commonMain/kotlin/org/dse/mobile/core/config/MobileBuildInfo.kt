package org.dse.mobile.core.config

object MobileBuildInfo {
    const val APP_NAME = "Jasvi Industries Mobile"
    const val MOBILE_VERSION = "1.2.2-V9.0.92-PREMIUM-UI"
    const val SERVER_BASELINE = "9.0.92"
    const val API_CONTRACT_VERSION = "server-9.0.92-compatible-v2"
    const val MINIMUM_SUPPORTED_MOBILE_VERSION = "1.2.2"
    const val EXPECTED_SERVER_SERVICE = "dse-erp-server"
    const val EXPECTED_API_REVISION = "spring-security-bearer-v5"
    const val UAT_SERVER_URL = "https://api-uat.jasviindustries.in"
    const val LEGACY_TEST_SERVER_URL = "https://api-test.jasviindustries.in"
    const val DEFAULT_DEV_SERVER_URL = UAT_SERVER_URL
    const val UAT_ONLY_TEST_BUILD = true
    const val BLOCKED_PROD_HOST = "api.jasviindustries.in"
}
