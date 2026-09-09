import SwiftUI
import WidgetKit

private struct DashboardEntry: TimelineEntry {
    let date: Date
    let salesToday: Double
    let receivables: Double
    let purchases: Double
    let payables: Double
    let bankBalance: Double
    let expenseMonth: Double
    let updatedAt: Date?
}

private struct DashboardProvider: TimelineProvider {
    func placeholder(in context: Context) -> DashboardEntry {
        DashboardEntry(date: Date(), salesToday: 0, receivables: 0, purchases: 0, payables: 0, bankBalance: 0, expenseMonth: 0, updatedAt: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (DashboardEntry) -> Void) {
        completion(load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DashboardEntry>) -> Void) {
        let entry = load()
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
    }

    private func load() -> DashboardEntry {
        let d = UserDefaults(suiteName: "group.org.dse.erp.mobile")
        let millis = d?.double(forKey: "dashboard.updatedAtMillis") ?? 0
        return DashboardEntry(
            date: Date(),
            salesToday: d?.double(forKey: "dashboard.salesToday") ?? 0,
            receivables: d?.double(forKey: "dashboard.receivables") ?? 0,
            purchases: d?.double(forKey: "dashboard.purchases") ?? 0,
            payables: d?.double(forKey: "dashboard.payables") ?? 0,
            bankBalance: d?.double(forKey: "dashboard.bankBalance") ?? 0,
            expenseMonth: d?.double(forKey: "dashboard.expenseMonth") ?? 0,
            updatedAt: millis > 0 ? Date(timeIntervalSince1970: millis / 1000.0) : nil
        )
    }
}

private struct DashboardWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: DashboardEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Jasvi Industries").font(.headline)
                Spacer()
                if let updatedAt = entry.updatedAt {
                    Text(updatedAt, style: .relative).font(.caption2).foregroundStyle(.secondary)
                }
            }
            if family == .systemSmall {
                Link(destination: URL(string: "dseerp://sales")!) {
                    metric("Sales Today", entry.salesToday)
                }
                Link(destination: URL(string: "dseerp://finance")!) {
                    metric("Receivables", entry.receivables)
                }
            } else {
                HStack(spacing: 12) {
                    Link(destination: URL(string: "dseerp://sales")!) { metric("Sales Today", entry.salesToday) }
                    Link(destination: URL(string: "dseerp://finance")!) { metric("Receivables", entry.receivables) }
                }
                HStack(spacing: 12) {
                    Link(destination: URL(string: "dseerp://purchase")!) { metric("Purchases", entry.purchases) }
                    Link(destination: URL(string: "dseerp://finance")!) { metric("Bank", entry.bankBalance) }
                }
            }
        }
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private func metric(_ title: String, _ value: Double) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value, format: .currency(code: "INR").precision(.fractionLength(0)))
                .font(.headline)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct DSEERPDashboardWidget: Widget {
    let kind = "DSEERPDashboardWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DashboardProvider()) { entry in
            DashboardWidgetView(entry: entry)
        }
        .configurationDisplayName("Jasvi Industries Dashboard")
        .description("Sales, receivables, purchases and bank KPIs from your last authenticated Jasvi Industries refresh.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
