package com.cybernet.internet_cafe_management.entity;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.regex.Pattern;
/** Converts a catalog package to immutable standard-minute benefits. */
public final class PlaytimeMinutes {
    private static final Pattern HOURS = Pattern.compile("(\\d+)\\s*(gi\u1edd|ti\u1ebfng|h|hour)");
    private static final Pattern MINUTES = Pattern.compile("(\\d+)\\s*(ph\u00fat|p|min)");

    private PlaytimeMinutes() {}
    public static int minutes(String name, String type, BigDecimal price) {
        if (!"PLAYTIME".equals(type)) return 0;
        String normalized = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        var hours = HOURS.matcher(normalized);
        if (hours.find()) return Math.multiplyExact(Integer.parseInt(hours.group(1)), 60);
        var minutes = MINUTES.matcher(normalized);
        if (minutes.find()) return Integer.parseInt(minutes.group(1));
        return price != null && price.signum() > 0
                ? price.multiply(BigDecimal.valueOf(60)).divide(BigDecimal.valueOf(10000), 0, RoundingMode.HALF_UP).intValueExact() : 60;
    }
}
