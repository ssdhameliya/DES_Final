package org.dse.mobile.core
import kotlin.test.*
import org.dse.mobile.core.api.*
import org.dse.mobile.core.security.MobileSecurityPolicy
import org.dse.mobile.core.config.MobileBuildInfo
class MobilePhaseContractTest{
 @Test fun writeRoutesRemainServerOwned(){assertEquals("/api/operations/sales",ExistingErpRoutes.SALES);assertEquals("/api/operations/purchases",ExistingErpRoutes.PURCHASES);assertEquals("/api/operations/finance",ExistingErpRoutes.FINANCE)}
 @Test fun productionNetworkingRequiresHttps(){assertTrue(MobileSecurityPolicy.isSafeEndpoint("https://erp.example.com"));assertFalse(MobileSecurityPolicy.isSafeEndpoint("http://erp.example.com"))}
 @Test fun mobileV1IsVersioned(){assertTrue(MobileV1Routes.BASE.endsWith("/v1"))}
 @Test fun parityMobileVersionPinsLiveServerBaseline(){assertEquals("1.2.2-V9.0.92-PREMIUM-UI",MobileBuildInfo.MOBILE_VERSION);assertEquals("9.0.92",MobileBuildInfo.SERVER_BASELINE);assertEquals("server-9.0.92-compatible-v2",MobileBuildInfo.API_CONTRACT_VERSION);assertEquals("1.2.2",MobileBuildInfo.MINIMUM_SUPPORTED_MOBILE_VERSION)}
 @Test fun productionSecurityRejectsPlainRemoteHttp(){assertFalse(MobileSecurityPolicy.isSafeEndpoint("http://10.0.0.50:8080"));assertTrue(MobileSecurityPolicy.isSafeEndpoint("http://127.0.0.1:8080"))}
 @Test fun uatTestBuildBlocksKnownProdHost(){assertTrue(MobileBuildInfo.UAT_ONLY_TEST_BUILD);assertFalse(MobileSecurityPolicy.isSafeEndpoint("https://api.jasviindustries.in"));assertTrue(MobileSecurityPolicy.endpointProblem("https://api.jasviindustries.in")?.contains("UAT-only")==true)}
}
