"use strict";

// The toggle status normalization logic is embedded in visualize_element_toggle()
// in rm_status.js:978-984 and requires DOM. This test replicates the logic as a
// standalone function so it can be verified without a DOM environment.
//
// Source (rm_status.js:978-984):
//   if (status.toUpperCase() === "FALSE")            { status = "0"; }
//   else if (status.toUpperCase().includes("OFF"))   { status = "0"; }
//   else if (status.toUpperCase() === "TRUE")        { status = "1"; }
//   else if (status.toUpperCase() === "ON")          { status = "1"; }
//   else if (status.toUpperCase() === "PARTLY")      { status = "0.5"; }
//   else if (status.toUpperCase() === "N/A")         { status = "U"; }
//   else                                             { status = "E"; }

function normalizeToggleStatus(status) {
    const s = status.toUpperCase();
    if (s === "FALSE")          return "0";
    else if (s.includes("OFF")) return "0";
    else if (s === "TRUE")      return "1";
    else if (s === "ON")        return "1";
    else if (s === "PARTLY")    return "0.5";
    else if (s === "N/A")       return "U";
    else                        return "E";
}

describe("normalizeToggleStatus", () => {

    test("test_false_string_normalizes_to_zero", () => {
        expect(normalizeToggleStatus("FALSE")).toBe("0");
        expect(normalizeToggleStatus("false")).toBe("0"); // case-insensitive
    });

    test("test_off_string_normalizes_to_zero", () => {
        expect(normalizeToggleStatus("OFF")).toBe("0");
        expect(normalizeToggleStatus("off")).toBe("0");
    });

    test("test_off_via_includes_not_duplicate", () => {
        // Bug #18: the original code had three === "OFF" checks, the third unreachable.
        // The fix uses includes("OFF"), which also covers compound strings.
        // Regression: compound "OFF" strings must still normalize to "0".
        expect(normalizeToggleStatus("STANDBY_OFF")).toBe("0");
        expect(normalizeToggleStatus("POWERED_OFF")).toBe("0");
        // Plain "OFF" must still work (no regression from removing the === check)
        expect(normalizeToggleStatus("OFF")).toBe("0");
    });

    test("test_on_string_unchanged", () => {
        // "ON" maps to the canonical on-value "1" — not an error state
        expect(normalizeToggleStatus("ON")).toBe("1");
        expect(normalizeToggleStatus("on")).toBe("1");
        expect(normalizeToggleStatus("TRUE")).toBe("1");
    });

    test("test_numeric_string_unchanged", () => {
        // NOTE: "0" and "1" do not match any branch and fall through to "E".
        // Device APIs that return numeric strings will produce error state.
        // This test documents current behaviour; pre-normalized values are not handled.
        expect(normalizeToggleStatus("0")).toBe("E");
        expect(normalizeToggleStatus("1")).toBe("E");
    });

});
