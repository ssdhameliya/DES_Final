import AppIntents
import Foundation

@available(iOS 17.0, *)
private enum DSEShortcutRouter {
    static func queue(_ deepLink: String) {
        UserDefaults.standard.set(deepLink, forKey: "dse.erp.pendingDeepLink")
    }
}

@available(iOS 17.0, *)
struct OpenDSEDashboardIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Jasvi Industries Dashboard"
    static var description = IntentDescription("Open the Jasvi Industries mobile dashboard.")
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        DSEShortcutRouter.queue("dseerp://dashboard")
        return .result()
    }
}

@available(iOS 17.0, *)
struct OpenDSESalesIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Jasvi Industries Sales"
    static var description = IntentDescription("Open the Sales register in Jasvi Industries Mobile.")
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        DSEShortcutRouter.queue("dseerp://sales")
        return .result()
    }
}

@available(iOS 17.0, *)
struct OpenDSEPurchaseIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Jasvi Industries Purchase"
    static var description = IntentDescription("Open the Purchase register in Jasvi Industries Mobile.")
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        DSEShortcutRouter.queue("dseerp://purchase")
        return .result()
    }
}

@available(iOS 17.0, *)
struct OpenDSEFinanceIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Jasvi Industries Bank and Expense"
    static var description = IntentDescription("Open Bank and Expense in Jasvi Industries Mobile.")
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        DSEShortcutRouter.queue("dseerp://finance")
        return .result()
    }
}

@available(iOS 17.0, *)
struct OpenDSEImportIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Jasvi Industries Data Import"
    static var description = IntentDescription("Open the Data Import loader in Jasvi Industries Mobile.")
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        DSEShortcutRouter.queue("dseerp://import")
        return .result()
    }
}

@available(iOS 17.0, *)
struct DSEERPAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenDSEDashboardIntent(),
            phrases: ["Open \(.applicationName) dashboard"],
            shortTitle: "Dashboard",
            systemImageName: "square.grid.2x2"
        )
        AppShortcut(
            intent: OpenDSESalesIntent(),
            phrases: ["Open sales in \(.applicationName)"],
            shortTitle: "Sales",
            systemImageName: "doc.text"
        )
        AppShortcut(
            intent: OpenDSEPurchaseIntent(),
            phrases: ["Open purchase in \(.applicationName)"],
            shortTitle: "Purchase",
            systemImageName: "cart"
        )
        AppShortcut(
            intent: OpenDSEFinanceIntent(),
            phrases: ["Open bank and expense in \(.applicationName)"],
            shortTitle: "Bank & Expense",
            systemImageName: "building.columns"
        )
        AppShortcut(
            intent: OpenDSEImportIntent(),
            phrases: ["Open data import in \(.applicationName)"],
            shortTitle: "Data Import",
            systemImageName: "square.and.arrow.down"
        )
    }
}
