package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.regex.Pattern;

/** Freeze legacy package benefits once using the catalog values available at upgrade. */
public class V11_1__BackfillPackageMinutes extends BaseJavaMigration {
    public static int minutes(String name, String type, BigDecimal price) {
        if (!"PLAYTIME".equals(type)) return 0;
        String normalized = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        var hours = Pattern.compile("(\\d+)\\s*(gi\u1edd|ti\u1ebfng|h|hour)").matcher(normalized);
        if (hours.find()) return Math.multiplyExact(Integer.parseInt(hours.group(1)), 60);
        var minutes = Pattern.compile("(\\d+)\\s*(ph\u00fat|p|min)").matcher(normalized);
        if (minutes.find()) return Integer.parseInt(minutes.group(1));
        return price != null && price.signum() > 0
                ? price.multiply(BigDecimal.valueOf(60)).divide(BigDecimal.valueOf(10000), 0, RoundingMode.HALF_UP).intValueExact() : 60;
    }
    @Override public void migrate(Context context) throws Exception {
        try (var query = context.getConnection().prepareStatement("SELECT id, item_name_snapshot, item_type_snapshot, unit_price FROM order_items WHERE package_minutes_snapshot IS NULL");
             var rows = query.executeQuery();
             var update = context.getConnection().prepareStatement("UPDATE order_items SET package_minutes_snapshot = ? WHERE id = ?")) {
            while (rows.next()) {
                update.setInt(1, minutes(rows.getString(2), rows.getString(3), rows.getBigDecimal(4)));
                update.setLong(2, rows.getLong(1));
                update.executeUpdate();
            }
        }
    }
}
