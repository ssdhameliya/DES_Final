JASVI INDUSTRIES — PHASE 6 CENTRALIZED DATA-FIRST PWA FOR iOS

Package version: 1.2.1-uat-phase6-ios
Source: Jasvi-Industries-PWA-UAT-PHASE6-CENTRALIZED-DATA-FIRST.zip
Configured server baseline: 9.0.92. This is not a port to desktop 9.0.96.
Environment: UAT; production switching remains disabled.
API: https://api-uat.jasviindustries.in
Intended hosting address: https://mobile-uat.jasviindustries.in
This delivery has NOT been deployed and does not establish that this address is live.

WHAT CHANGED
- Preserved the original Phase 6 app.js, visual system and ERP routes.
- Public shell cache includes PNG and Apple touch icons.
- Service worker handles only known public assets and app-entry navigation.
  ERP responses and authenticated requests are not put in its cache.
- Cache cleanup only removes older Phase 6 caches, leaving unrelated apps intact.
- A new worker waits for old app windows to close before activation, avoiding
  forced mid-session replacement. Close all app windows and reopen after updates.
- Restored browser zoom accessibility.

HOSTING AND IPHONE INSTALLATION
1. Extract this archive. Publish the files with index.html at the web root on
   the intended HTTPS UAT host. Keep icons/ and its contents together.
2. Configure the ERP server CORS allowlist for the actual web origin. Preserve
   server authentication and authorization. Do not enable production switching.
3. On iPhone, open the deployed HTTPS URL in Safari, use Share > Add to Home
   Screen, and enable Open as Web App if that option is shown. Open the new icon.
4. Sign in using an existing UAT account and test the workflows listed below.
A ZIP opened directly from Files is not an installed PWA. This package is web
source, not an Xcode project or signed IPA/App Store application.

EXISTING FUNCTIONAL LIMITS
- Full New Sale and New Purchase editors remain native/Desktop actions.
- Browser import executes Bank Statement CSV imports; other module imports
  require the native/Desktop mapping and validation editor.
- The package does not implement native Keychain/Face ID unlock or APNs push.
- Offline shell access does not mean offline ERP data availability. Business
  operations require a reachable ERP. Financial writes are not silently queued.
- The inherited Remember Me feature stores a bearer token in browser local
  storage; default sessions use session storage. This is not native Keychain.

VALIDATION COMPLETED
- JavaScript syntax checks: app.js, config.js, sw.js.
- HTML and web manifest local asset references resolve.
- Service-worker test: shell cache includes Apple touch icon; unrelated caches
  survive cleanup; eight routing cases cover entry navigation, public assets,
  API paths, authorization, POST, external origin and unknown assets.

REMAINING UAT CHECKS
Live ERP credentials and an iPhone were not available for verification.
Check Safari login, permissions, dashboard/register data, PDF/download actions,
explicit write confirmations, session expiry, Home Screen launch, offline error
behavior and close/reopen updates. No live transactions were performed.
