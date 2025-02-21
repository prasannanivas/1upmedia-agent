import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const dateFormatters = {
  toUTC: (dateString) => {
    try {
      return formatInTimeZone(
        parseISO(dateString),
        "UTC",
        "yyyy-MM-dd HH:mm:ss"
      );
    } catch (error) {
      console.error("Date parsing error:", error);
      return format(new Date(), "yyyy-MM-dd HH:mm:ss");
    }
  },

  fromUTC: (utcString, timezone = "America/New_York") => {
    try {
      return formatInTimeZone(
        parseISO(utcString),
        timezone,
        "yyyy-MM-dd HH:mm:ss"
      );
    } catch (error) {
      console.error("Date parsing error:", error);
      return format(new Date(), "yyyy-MM-dd HH:mm:ss");
    }
  },
};
