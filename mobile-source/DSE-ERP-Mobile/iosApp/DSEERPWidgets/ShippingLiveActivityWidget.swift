import ActivityKit
import SwiftUI
import WidgetKit

struct ShippingLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShippingActivityAttributes.self) { context in
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Jasvi Industries • \(context.attributes.invoiceNo)").font(.headline)
                    Spacer()
                    Text(context.state.stage).font(.caption).bold()
                }
                Text(context.attributes.customer).font(.subheadline)
                HStack {
                    Label(context.attributes.transporter.isEmpty ? "Transporter pending" : context.attributes.transporter, systemImage: "truck.box")
                    Spacer()
                    if !context.attributes.vehicle.isEmpty { Text(context.attributes.vehicle).font(.caption) }
                }
                .font(.caption)
                Text("Live Activity mirrors mobile dispatch tracking; ERP Sale status remains server-owned.")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .padding()
            .activityBackgroundTint(.black.opacity(0.86))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.invoiceNo).font(.caption).bold()
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.stage).font(.caption)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.customer).font(.caption)
                }
            } compactLeading: {
                Image(systemName: "shippingbox.fill")
            } compactTrailing: {
                Text(context.state.stage.prefix(3)).font(.caption2)
            } minimal: {
                Image(systemName: "shippingbox.fill")
            }
            .widgetURL(URL(string: "dseerp://sales/\(context.attributes.invoiceNo)"))
        }
    }
}
