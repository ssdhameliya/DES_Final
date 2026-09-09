import ActivityKit
import Foundation

struct ShippingActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var stage: String
        var updatedAt: Date
    }

    var invoiceNo: String
    var customer: String
    var transporter: String
    var vehicle: String
}
