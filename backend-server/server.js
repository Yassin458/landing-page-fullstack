// backend-server/server.js
const express = require('express'); // استيراد مكتبة Express
const cors = require('cors');     // استيراد مكتبة CORS

const app = express();            // إنشاء تطبيق Express
const PORT = 3001;                // تحديد المنفذ الذي سيعمل عليه الخادم المحلي

// === Middleware ===
// السماح لطلبات CORS (من أي مصدر في هذه الحالة، مناسب للتطوير المحلي)
app.use(cors());
// السماح لـ Express بقراءة بيانات JSON المرسلة في body الطلبات
app.use(express.json());

console.log("🔧 الخادم المحلي: إعداد نقاط الاستقبال (Endpoints)...");

// === نقاط الاستقبال (API Endpoints) ===

// 1. نقطة استقبال طلبات الشراء (POST /api/local/orders)
app.post('/api/local/orders', (req, res) => {
    // 'req' يحتوي على معلومات الطلب القادم (بما في ذلك البيانات المرسلة)
    // 'res' يُستخدم لإرسال الرد إلى الواجهة الأمامية

    console.log("\n=====================================");
    console.log("🛒 [الخادم المحلي] تم استقبال طلب شراء جديد!");
    console.log("=====================================");

    try {
        // الحصول على البيانات من body الطلب (التي أرسلها fetch)
        const orderData = req.body;

        // ** محاكاة المعالجة: فقط طباعة البيانات في الطرفية **
        console.log("  [بيانات العميل]:");
        console.log(`    الاسم: ${orderData.customerInfo?.fullName || 'غير متوفر'}`);
        console.log(`    الهاتف: ${orderData.customerInfo?.phone || 'غير متوفر'}`);
        console.log(`    العنوان: ${orderData.customerInfo?.address || 'غير متوفر'}`);
        console.log(`    المدينة: ${orderData.customerInfo?.city || 'غير متوفر'}`);
        console.log(`    الملاحظات: ${orderData.customerInfo?.notes || 'لا يوجد'}`);
        console.log("\n  [المنتجات المطلوبة]:");
        if (orderData.items && orderData.items.length > 0) {
            orderData.items.forEach((item, index) => {
                console.log(`    - المنتج ${index + 1}: ${item.name} (${item.type}) | الحجم: ${item.size}مل | الكمية: ${item.quantity} | السعر: ${item.price?.toFixed(2)} | المجموع: ${(item.quantity * item.price).toFixed(2)}`);
            });
        } else {
            console.log("    (لا توجد منتجات)");
        }
        console.log(`\n  [المجموع الكلي المحسوب (أمامي)]: ${orderData.totalAmount?.toFixed(2) || 'غير متوفر'}`);
        console.log(`  [العرض المطبق (أمامي)]: ${orderData.offerApplied || 'لا يوجد'}`);
        console.log(`  [نوع الطلب (أمامي)]: ${orderData.orderType || 'غير محدد'}`);


        // ** في الخادم الحقيقي: هنا تقوم بالتحقق من صحة البيانات وحفظها في قاعدة بيانات **

        const fakeOrderId = `local_${Date.now()}`; // معرف وهمي فقط للتجربة
        console.log("\n✅ [الخادم المحلي] تمت معالجة الطلب بنجاح (محاكاة).");

        // إرسال رد إيجابي إلى الواجهة الأمامية
        res.status(200).json({
            success: true,
            message: "تم استلام طلبك بنجاح (من الخادم المحلي)!",
            orderId: fakeOrderId // يمكنك إعادة أي بيانات مفيدة
        });

    } catch (error) {
        // في حالة حدوث أي خطأ أثناء المعالجة
        console.error("❌ [الخادم المحلي] خطأ أثناء معالجة طلب الشراء:", error);
        res.status(500).json({ success: false, message: "حدث خطأ في الخادم المحلي أثناء معالجة الطلب." });
    }
    console.log("=====================================");
});

// 2. نقطة استقبال اشتراكات النشرة (POST /api/local/subscribe)
app.post('/api/local/subscribe', (req, res) => {
    console.log("\n=====================================");
    console.log("📧 [الخادم المحلي] تم استقبال طلب اشتراك جديد!");
    console.log("=====================================");
    try {
        const { email, name } = req.body; // الحصول على البريد والاسم

        // ** محاكاة المعالجة: فقط طباعة البيانات **
        console.log(`  البريد الإلكتروني: ${email || 'غير متوفر'}`);
        console.log(`  الاسم: ${name || '(لم يتم توفيره)'}`);

        // ** في الخادم الحقيقي: هنا تتحقق من البريد وتحفظه في قائمة المشتركين **

        console.log("✅ [الخادم المحلي] تمت معالجة الاشتراك بنجاح (محاكاة).");

        // إرسال رد إيجابي
        res.status(200).json({
            success: true,
            message: "تم تسجيل الاشتراك بنجاح (من الخادم المحلي)!"
        });

    } catch (error) {
        console.error("❌ [الخادم المحلي] خطأ أثناء معالجة الاشتراك:", error);
        res.status(500).json({ success: false, message: "حدث خطأ في الخادم المحلي أثناء معالجة الاشتراك." });
    }
    console.log("=====================================");
});


// === بدء تشغيل الخادم ===
app.listen(PORT, () => {
    console.log(`\n🚀 الخادم المحلي يعمل الآن على http://localhost:${PORT}`);
    console.log("   (اترك نافذة الطرفية هذه مفتوحة لتشغيل الخادم)");
    console.log("   (اضغط CTRL+C لإيقافه)");
    console.log("\n   الخطوة التالية: افتح ملف public/index.html في متصفحك.");
});