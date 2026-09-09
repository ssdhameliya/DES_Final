import ActivityKit
import Foundation
import WidgetKit

enum DSESharedStore {
    static let appGroup = "group.org.dse.erp.mobile"
    static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }
}

enum DashboardWidgetPublisher {
    static func publish(
        salesToday: Double,
        receivables: Double,
        purchases: Double,
        payables: Double,
        bankBalance: Double,
        expenseMonth: Double,
        updatedAtMillis: Int64
    ) {
        guard let defaults = DSESharedStore.defaults else { return }
        defaults.set(salesToday, forKey: "dashboard.salesToday")
        defaults.set(receivables, forKey: "dashboard.receivables")
        defaults.set(purchases, forKey: "dashboard.purchases")
        defaults.set(payables, forKey: "dashboard.payables")
        defaults.set(bankBalance, forKey: "dashboard.bankBalance")
        defaults.set(expenseMonth, forKey: "dashboard.expenseMonth")
        defaults.set(Double(updatedAtMillis), forKey: "dashboard.updatedAtMillis")
        defaults.synchronize()
        WidgetCenter.shared.reloadTimelines(ofKind: "DSEERPDashboardWidget")
    }
}

@available(iOS 16.1, *)
enum ShippingLiveActivityService {
    static func start(
        invoiceNo: String,
        customer: String,
        transporter: String,
        vehicle: String
    ) async -> (Bool, String) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            return (false, "Live Activities are disabled in iOS Settings.")
        }
        if Activity<ShippingActivityAttributes>.activities.contains(where: { $0.attributes.invoiceNo == invoiceNo }) {
            return (true, "A Live Activity is already running for \(invoiceNo).")
        }
        let attributes = ShippingActivityAttributes(
            invoiceNo: invoiceNo,
            customer: customer,
            transporter: transporter,
            vehicle: vehicle
        )
        let state = ShippingActivityAttributes.ContentState(stage: "Ready", updatedAt: Date())
        do {
            _ = try Activity.request(
                attributes: attributes,
                content: ActivityContent(state: state, staleDate: nil),
                pushType: nil
            )
            return (true, "Shipping Live Activity started for \(invoiceNo).")
        } catch {
            return (false, error.localizedDescription)
        }
    }

    static func update(invoiceNo: String, stage: String) async -> (Bool, String) {
        guard let activity = Activity<ShippingActivityAttributes>.activities.first(where: { $0.attributes.invoiceNo == invoiceNo }) else {
            return (false, "No running Live Activity was found for \(invoiceNo).")
        }
        let state = ShippingActivityAttributes.ContentState(stage: stage, updatedAt: Date())
        await activity.update(ActivityContent(state: state, staleDate: nil))
        return (true, "Live Activity updated to \(stage).")
    }

    static func end(invoiceNo: String) async -> (Bool, String) {
        guard let activity = Activity<ShippingActivityAttributes>.activities.first(where: { $0.attributes.invoiceNo == invoiceNo }) else {
            return (false, "No running Live Activity was found for \(invoiceNo).")
        }
        let finalState = ShippingActivityAttributes.ContentState(stage: "Closed", updatedAt: Date())
        await activity.end(
            ActivityContent(state: finalState, staleDate: nil),
            dismissalPolicy: .default
        )
        return (true, "Shipping Live Activity ended for \(invoiceNo).")
    }
}
