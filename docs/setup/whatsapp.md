# WhatsApp contact and Business API prerequisites

The storefront can publish a WhatsApp contact link from **Admin → Settings** (`/admin/settings`). Enter a phone number, use an international country code, then enable its switch. The resulting `https://wa.me/` destination contains digits only. A normal WhatsApp number enables a visitor to open a chat; it does **not** enable Wardity to send automated outbound messages.

## Automated messaging is optional

Order notifications can use the WhatsApp Cloud API when the backend variables
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ORDER_RECIPIENTS`, and
`WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE_NAME`, and `WHATSAPP_TEMPLATE_LANG`
are configured. This is separate from the public
WhatsApp link. Automated messaging requires a Meta Business account, a
WhatsApp Business Account, an approved/registered phone number, a Cloud API
phone-number ID, an access token stored as a production secret, and approved
message templates where required. Do not put tokens in Admin Settings, the
JSON contact config, source control, or chat.

Test first with Meta's configured test number and an authorized recipient using
the official Graph API test tooling; validate the response and delivery status
before using an approved business number/template. Delivery can be limited by
template approval, user opt-in and messaging windows, quality/rate limits,
recipient country rules, account verification, and token permissions.

## Arabic Utility order template

The code is prepared for this template; it is **not** approved or tested
against Meta until you create and approve it in Meta Business Manager.
Defaults are `WHATSAPP_TEMPLATE_NAME=new_order_alert_ar` and
`WHATSAPP_TEMPLATE_LANG=ar`. Create it as a **Utility** template with an
image header and use this exact Arabic body text:

```text
🛍️ طلب جديد من Wardity
رقم الطلب: {{1}}
وقت الطلب: {{2}}

👤 العميل: {{3}}
📞 الهاتف: {{4}}

🌸 المنتجات: {{5}}
💰 الإجمالي: {{6}}
💳 طريقة الدفع: {{7}}

📍 العنوان: {{8}}
🗺️ الخريطة: {{9}}
🕒 موعد التوصيل: {{10}}

📝 ملاحظات: {{11}}

يرجى مراجعة الطلب وتأكيده من لوحة التحكم.
```

The backend sends exactly these 11 body parameters:

| Variable | Value |
|---|---|
| `{{1}}` | Order number |
| `{{2}}` | Order time in `dd/mm/yyyy h:mm` with `م`/`ص`, using `Africa/Cairo` |
| `{{3}}` | Customer name |
| `{{4}}` | Customer phone |
| `{{5}}` | Single-line items summary, for example `باقة ورد جوري x1 \| فازة x2` |
| `{{6}}` | Total followed by `جنيه` |
| `{{7}}` | Arabic payment method |
| `{{8}}` | Delivery address |
| `{{9}}` | Google Maps address-search link |
| `{{10}}` | Delivery date and time |
| `{{11}}` | Notes, capped at 300 characters |

Every parameter has newlines and tabs replaced, long space runs limited,
leading/trailing whitespace removed, and an empty value replaced with `لا يوجد`.
The first product image is used as the header when it is a public HTTPS URL.
Up to three additional product images are sent as best-effort follow-up
messages.

The `notes` migration is safe for existing databases: it adds a nullable
`TEXT` column using the existing `addColumnIfMissing` migration helper, so
existing rows and data are not rewritten or lost. New notes are validated by
the backend with a maximum length of 300 characters.
