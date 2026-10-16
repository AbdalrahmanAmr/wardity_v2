import type en from "./storefront.en";
const ar: Partial<Record<keyof typeof en, string>> = {
  languageSwitch: "English", banner: "🌹 توصيل مجاني للطلبات فوق {threshold} جنيه | توصيل في نفس اليوم بالقاهرة والجيزة",
  searchPlaceholder: "ما الذي تبحث عنه؟", basket: "السلة", wishlist: "قائمة الأمنيات", login: "تسجيل الدخول", account: "الحساب", deliveryTo: "التوصيل إلى", light: "فاتح", dark: "داكن",
  shop: "تسوق", support: "الدعم", company: "الشركة", contactUs: "اتصل بنا", faqs: "الأسئلة الشائعة", deliveryInfo: "معلومات التوصيل", trackOrder: "تتبع الطلب", aboutUs: "من نحن", privacy: "سياسة الخصوصية", terms: "الشروط والأحكام", rights: "جميع الحقوق محفوظة.", cookieSettings: "إعدادات ملفات تعريف الارتباط",
  heroTitle: "زهور تعبّر عن المشاعر", giftNow: "أهدِ الآن", bestSellers: "الأكثر مبيعًا", shopByCategory: "تسوق حسب الفئة", shopByOccasion: "تسوق حسب المناسبة", featuredProducts: "منتجات مميزة", newArrivals: "وصل حديثًا", viewAll: "عرض الكل",
  addToCart: "أضف إلى السلة", outOfStock: "غير متوفر", continueShopping: "متابعة التسوق", emptyCart: "سلتك فارغة", cartTitle: "سلة التسوق", subtotal: "الإجمالي الفرعي", total: "الإجمالي", checkout: "إتمام الشراء", remove: "حذف", update: "تحديث", quantity: "الكمية",
  orders: "طلباتي", noOrders: "لا توجد طلبات بعد", startShopping: "ابدأ التسوق", viewDetails: "عرض التفاصيل", profile: "الملف الشخصي", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم", submit: "إرسال", save: "حفظ", cancel: "إلغاء", logout: "تسجيل الخروج",
  productNotFound: "المنتج غير موجود", notFound: "الصفحة غير موجودة", backToShop: "العودة إلى المتجر", errorTitle: "حدث خطأ ما", tryAgain: "يرجى المحاولة مرة أخرى لاحقًا.", loading: "جارٍ التحميل...", accept: "موافقة", decline: "رفض", cookieMessage: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك.", cookieTitle: "خصوصيتك تهمنا", cookieOptional: "نستخدم ملفات تعريف ارتباط اختيارية للتسويق والتحليلات لتحسين ورديتي.", cookieDetails: "التسويق والتحليلات اختياريان ويظلان متوقفين ما لم توافق.", customize: "تخصيص",
  noProducts: "لم يتم العثور على منتجات", search: "بحث", price: "السعر", description: "الوصف", reviews: "التقييمات", size: "المقاس", color: "اللون", availability: "التوفر", cartAdded: "تمت الإضافة إلى السلة", required: "هذا الحقل مطلوب", invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا", passwordMin: "يجب ألا تقل كلمة المرور عن ٨ أحرف",
  contact: "تواصل معنا", callPhone: "اتصل على {value}", emailUs: "راسلنا على {value}", whatsappUs: "راسلنا عبر واتساب", telegramUs: "تواصل معنا عبر تيليجرام",
};
export default ar;
