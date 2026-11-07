/**
 * Reserved keys for SDK/system-managed customer profile fields (not custom attributes).
 * Keep in sync with packages/shared/cjs/customerSystemAttributeKeys.cjs (do not add a runtime dependency on @tappd/shared for npm installs).
 */
export declare const CUSTOMER_SYSTEM_ATTRIBUTE_KEYS: Readonly<{
    readonly TIMEZONE: "timezone";
    readonly LOCALE: "locale";
    readonly COUNTRY: "country";
    readonly CITY: "city";
    readonly LAST_DEVICE_NAME: "last_device_name";
}>;
export declare const CUSTOMER_SYSTEM_ATTRIBUTE_KEY_LIST: readonly string[];
//# sourceMappingURL=customerSystemAttributeKeys.d.ts.map