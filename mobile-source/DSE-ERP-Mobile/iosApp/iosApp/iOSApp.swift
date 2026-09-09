import SwiftUI
import ComposeApp
import Security
import LocalAuthentication
import UniformTypeIdentifiers
import UIKit
import UserNotifications

@main
struct DSEERPMobileApp: App {
    @UIApplicationDelegateAdaptor(DSEAppDelegate.self) private var appDelegate

    init() {
        NativeServices.install()
    }

    var body: some Scene {
        WindowGroup {
            ComposeView()
                .ignoresSafeArea(.keyboard)
                .onOpenURL { url in
                    NativeDeepLinkStore.store(url.absoluteString)
                }
        }
    }
}

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

private enum NativeServices {
    static func install() {
        IosNativeBridgeKt.installIosNativeServices(
            loadToken: { KeychainTokenStore.load() },
            saveToken: { token in KeychainTokenStore.save(token) },
            clearToken: { KeychainTokenStore.clear() },
            loadServerUrl: { UserDefaults.standard.string(forKey: "dse.erp.lastServerUrl") },
            saveServerUrl: { value in UserDefaults.standard.set(value, forKey: "dse.erp.lastServerUrl") },
            biometricState: { NativeBiometrics.isAvailable ? "AVAILABLE" : "UNAVAILABLE" },
            authenticateBiometric: { reason, completion in
                NativeBiometrics.authenticate(reason: reason) { success, message in
                    completion(success ? "OK" : "ERROR", message)
                }
            },
            pickImportFile: { completion in
                NativeImportPicker.shared.pick { fileName, rawText, error in
                    completion(fileName, rawText, error)
                }
            },
            requestPush: { completion in
                NativePushService.shared.requestPermission { granted, token, message in
                    completion(granted ? "OK" : (message ?? "Notification permission was not granted."), token)
                }
            },
            pickAttachment: { completion in
                NativeAttachmentPicker.shared.pick { fileName, base64, error in completion(fileName, base64, error) }
            },
            shareText: { title, text in NativeShareService.share(title: title, text: text) },
            shareFile: { title, fileName, base64 in NativeShareService.shareFile(title: title, fileName: fileName, base64: base64) },
            openExternalUrl: { value in NativeShareService.open(value) },
            consumeDeepLink: {
                NativeDeepLinkStore.consume()
            },
            publishWidgetSnapshot: { salesToday, receivables, purchases, payables, bankBalance, expenseMonth, updatedAtMillis in
                DashboardWidgetPublisher.publish(
                    salesToday: salesToday,
                    receivables: receivables,
                    purchases: purchases,
                    payables: payables,
                    bankBalance: bankBalance,
                    expenseMonth: expenseMonth,
                    updatedAtMillis: updatedAtMillis
                )
            },
            startShippingActivity: { invoiceNo, customer, transporter, vehicle, completion in
                guard #available(iOS 16.1, *) else {
                    completion("ERROR", "Live Activities require iOS 16.1 or later.")
                    return
                }
                Task {
                    let result = await ShippingLiveActivityService.start(
                        invoiceNo: invoiceNo,
                        customer: customer,
                        transporter: transporter,
                        vehicle: vehicle
                    )
                    completion(result.0 ? "OK" : "ERROR", result.1)
                }
            },
            updateShippingActivity: { invoiceNo, stage, completion in
                guard #available(iOS 16.1, *) else {
                    completion("ERROR", "Live Activities require iOS 16.1 or later.")
                    return
                }
                Task {
                    let result = await ShippingLiveActivityService.update(invoiceNo: invoiceNo, stage: stage)
                    completion(result.0 ? "OK" : "ERROR", result.1)
                }
            },
            endShippingActivity: { invoiceNo, completion in
                guard #available(iOS 16.1, *) else {
                    completion("ERROR", "Live Activities require iOS 16.1 or later.")
                    return
                }
                Task {
                    let result = await ShippingLiveActivityService.end(invoiceNo: invoiceNo)
                    completion(result.0 ? "OK" : "ERROR", result.1)
                }
            }
        )
    }
}

private enum KeychainTokenStore {
    private static let service = "org.dse.erp.mobile"
    private static let account = "access-token"

    static func load() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func save(_ token: String?) {
        guard let token, !token.isEmpty else {
            clear()
            return
        }
        let data = Data(token.utf8)
        let key: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let update: [String: Any] = [kSecValueData as String: data]
        let status = SecItemUpdate(key as CFDictionary, update as CFDictionary)
        if status == errSecItemNotFound {
            var add = key
            add[kSecValueData as String] = data
            add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            SecItemAdd(add as CFDictionary, nil)
        }
    }

    static func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
    }
}

private enum NativeBiometrics {
    static var isAvailable: Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    static func authenticate(reason: String, completion: @escaping (Bool, String?) -> Void) {
        let context = LAContext()
        context.localizedCancelTitle = "Use Password"
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            completion(false, error?.localizedDescription ?? "Face ID / Touch ID is not available on this device.")
            return
        }
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, authError in
            DispatchQueue.main.async {
                completion(success, success ? "Authenticated" : (authError?.localizedDescription ?? "Biometric authentication failed."))
            }
        }
    }
}

private final class NativeImportPicker: NSObject, UIDocumentPickerDelegate {
    static let shared = NativeImportPicker()
    private var completion: ((String?, String?, String?) -> Void)?

    func pick(completion: @escaping (String?, String?, String?) -> Void) {
        self.completion = completion
        DispatchQueue.main.async {
            let types: [UTType] = [.commaSeparatedText, .plainText]
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
            picker.delegate = self
            picker.allowsMultipleSelection = false
            guard let presenter = Self.topViewController() else {
                self.finish(nil, nil, "Unable to present the iOS Files picker.")
                return
            }
            presenter.present(picker, animated: true)
        }
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else {
            finish(nil, nil, "No file selected.")
            return
        }
        let fileName = url.lastPathComponent
        let ext = url.pathExtension.lowercased()
        guard ext == "csv" || ext == "txt" else {
            finish(fileName, nil, "Select a CSV file for mobile Data Import.")
            return
        }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        do {
            let data = try Data(contentsOf: url)
            guard data.count <= 20 * 1024 * 1024 else {
                finish(fileName, nil, "Import file exceeds the 20 MB mobile safety limit.")
                return
            }
            guard let text = String(data: data, encoding: .utf8) ?? String(data: data, encoding: .utf16) else {
                finish(fileName, nil, "The selected file could not be decoded as text.")
                return
            }
            finish(fileName, text, nil)
        } catch {
            finish(fileName, nil, error.localizedDescription)
        }
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish(nil, nil, nil)
    }

    private func finish(_ fileName: String?, _ rawText: String?, _ error: String?) {
        let callback = completion
        completion = nil
        callback?(fileName, rawText, error)
    }

    private static func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        let root = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
        var current = root
        while let presented = current?.presentedViewController { current = presented }
        if let navigation = current as? UINavigationController { return navigation.visibleViewController ?? navigation }
        if let tabs = current as? UITabBarController { return tabs.selectedViewController ?? tabs }
        return current
    }
}


private final class NativeAttachmentPicker: NSObject, UIDocumentPickerDelegate {
    static let shared = NativeAttachmentPicker()
    private var completion: ((String?, String?, String?) -> Void)?

    func pick(completion: @escaping (String?, String?, String?) -> Void) {
        self.completion = completion
        DispatchQueue.main.async {
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.data, .image, .pdf, .plainText], asCopy: true)
            picker.delegate = self
            picker.allowsMultipleSelection = false
            guard let presenter = NativeViewControllerLocator.top else {
                self.finish(nil, nil, "Unable to present the attachment picker.")
                return
            }
            presenter.present(picker, animated: true)
        }
    }
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url=urls.first else { finish(nil,nil,"No file selected."); return }
        let scoped=url.startAccessingSecurityScopedResource(); defer{if scoped{url.stopAccessingSecurityScopedResource()}}
        do {
            let data=try Data(contentsOf:url)
            guard data.count <= 20 * 1024 * 1024 else { finish(url.lastPathComponent,nil,"Attachment exceeds the 20 MB mobile limit."); return }
            finish(url.lastPathComponent,data.base64EncodedString(),nil)
        } catch { finish(url.lastPathComponent,nil,error.localizedDescription) }
    }
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { finish(nil,nil,nil) }
    private func finish(_ name:String?,_ base64:String?,_ error:String?){let cb=completion;completion=nil;cb?(name,base64,error)}
}

private enum NativeViewControllerLocator {
    static var top: UIViewController? {
        let scene=UIApplication.shared.connectedScenes.compactMap{$0 as? UIWindowScene}.first{$0.activationState == .foregroundActive}
        var current=scene?.windows.first{$0.isKeyWindow}?.rootViewController
        while let presented=current?.presentedViewController { current=presented }
        if let nav=current as? UINavigationController { return nav.visibleViewController ?? nav }
        if let tabs=current as? UITabBarController { return tabs.selectedViewController ?? tabs }
        return current
    }
}

private enum NativeShareService {
    @discardableResult static func share(title:String,text:String)->Bool {
        guard let presenter=NativeViewControllerLocator.top else { return false }
        DispatchQueue.main.async {
            let controller=UIActivityViewController(activityItems:[title,text],applicationActivities:nil)
            if let pop=controller.popoverPresentationController { pop.sourceView=presenter.view; pop.sourceRect=CGRect(x:presenter.view.bounds.midX,y:presenter.view.bounds.midY,width:1,height:1) }
            presenter.present(controller,animated:true)
        }
        return true
    }
    @discardableResult static func shareFile(title:String,fileName:String,base64:String)->Bool {
        guard let presenter=NativeViewControllerLocator.top, let data=Data(base64Encoded:base64) else { return false }
        let safe=fileName.replacingOccurrences(of:"/",with:"_").replacingOccurrences(of:"\\",with:"_")
        let url=FileManager.default.temporaryDirectory.appendingPathComponent(safe.isEmpty ? "attachment.bin" : safe)
        do { try data.write(to:url,options:.atomic) } catch { return false }
        DispatchQueue.main.async {
            let controller=UIActivityViewController(activityItems:[title,url],applicationActivities:nil)
            if let pop=controller.popoverPresentationController { pop.sourceView=presenter.view; pop.sourceRect=CGRect(x:presenter.view.bounds.midX,y:presenter.view.bounds.midY,width:1,height:1) }
            presenter.present(controller,animated:true)
        }
        return true
    }
    @discardableResult static func open(_ value:String)->Bool {
        guard let url=URL(string:value),UIApplication.shared.canOpenURL(url) else { return false }
        DispatchQueue.main.async { UIApplication.shared.open(url) }
        return true
    }
}


final class DSEAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        if let payload = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
            NativeDeepLinkStore.store(payload["deepLink"] as? String)
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        NativePushService.shared.didReceiveDeviceToken(token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NativePushService.shared.didFail(error.localizedDescription)
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let payload = response.notification.request.content.userInfo
        NativeDeepLinkStore.store(payload["deepLink"] as? String)
        completionHandler()
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
}

private final class NativePushService {
    static let shared = NativePushService()
    private let tokenKey = "dse.erp.apns.deviceToken"
    private var pending: ((Bool, String?, String?) -> Void)?

    func requestPermission(completion: @escaping (Bool, String?, String?) -> Void) {
        pending = completion
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                if let error {
                    self.finish(false, nil, error.localizedDescription)
                    return
                }
                guard granted else {
                    self.finish(false, nil, "Notification permission was not granted.")
                    return
                }
                UIApplication.shared.registerForRemoteNotifications()
                if let token = UserDefaults.standard.string(forKey: self.tokenKey), !token.isEmpty {
                    self.finish(true, token, "Notifications enabled.")
                }
            }
        }
    }

    func didReceiveDeviceToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: tokenKey)
        finish(true, token, "APNs token captured.")
    }

    func didFail(_ message: String) {
        finish(false, nil, message)
    }

    private func finish(_ granted: Bool, _ token: String?, _ message: String?) {
        let callback = pending
        pending = nil
        callback?(granted, token, message)
    }
}

private enum NativeDeepLinkStore {
    private static let key = "dse.erp.pendingDeepLink"

    static func store(_ value: String?) {
        guard let value, !value.isEmpty else { return }
        UserDefaults.standard.set(value, forKey: key)
    }

    static func consume() -> String? {
        let value = UserDefaults.standard.string(forKey: key)
        UserDefaults.standard.removeObject(forKey: key)
        return value
    }
}
