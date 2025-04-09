const API_BASE_URL = "http://localhost:3001"; // عنوان الخادم المحلي
const submitOrderUrl = `${API_BASE_URL}/api/local/orders`;
const subscribeUrl = `${API_BASE_URL}/api/local/subscribe`;

("use strict"); // تفعيل الوضع الصارم

// ==========================================================
// ===== ثوابت ومتغيرات رئيسية =====
// ==========================================================
const LS_CART_KEY = "perfumeCart";
const LS_SELECTION_PREFIX = "perfumeSelection_";
const OFFER_5_PRICE = 150;
const OFFER_10_PRICE = 255;
const DYNAMIC_OFFER_10_PLUS_DISCOUNT_RATE = 0.85; // 15% discount
const STATIC_PERFUMES = {
    men_5: [
        "سوفاج ديور",
        "بلو دي شانيل",
        "أكوا دي جيو أرماني",
        "تيري دي هيرمس",
        "لا نوي دي لوم YSL",
    ],
    women_5: [
        "جادور ديور",
        "شانيل N°5",
        "لا في إي بيل لانكوم",
        "بلاك أوبيوم YSL",
        "جود جيرل كارولينا هيريرا",
    ],
    men_10: [
        "سوفاج ديور",
        "بلو دي شانيل",
        "أكوا دي جيو أرماني",
        "تيري دي هيرمس",
        "لا نوي دي لوم YSL",
        "كريد أفينتوس (مستوحى)",
        "ون مليون باكو رابان",
        "إنفيكتوس باكو رابان",
        "ديور هوم إنتنس",
        "ألور هوم سبورت شانيل",
    ],
    women_10: [
        "جادور ديور",
        "شانيل N°5",
        "لا في إي بيل لانكوم",
        "بلاك أوبيوم YSL",
        "جود جيرل كارولينا هيريرا",
        "سي أرماني",
        "كوكو مادموازيل شانيل",
        "برايت كريستال فيرزاتشي",
        "إلين موغلر",
        "ديزي مارك جاكوبس",
    ],
};

let notificationTimeout;
let itemNotificationTimeout;
let checkoutTriggerType = null;
const originalLabels = {};

// ==========================================================
// ================== DOMContentLoaded ====================
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    // ===== اختيار عناصر DOM الرئيسية =====
    const mainSidebar = document.getElementById("mainSidebar");
    const cartSidebar = document.getElementById("cartSidebar");
    const mainSidebarToggle = document.getElementById("main-sidebar-toggle");
    const cartSidebarToggle = document.getElementById("cart-sidebar-toggle");
    const mainSidebarOverlay = document.getElementById("mainSidebarOverlay");
    const cartSidebarOverlay = document.getElementById("cartSidebarOverlay");
    const sidebarCloseButtons = document.querySelectorAll(".close-sidebar-btn");
    const mainPageContent = document.getElementById("main-content-area");
    const cartCountBadge = document.getElementById("cart-count-badge");
    const mainNavLinks = document.querySelectorAll(
        ".main-sidebar .sidebar-nav-link"
    );
    const brandLinkTop = document.getElementById("brand-link-to-home-top");
    const brandLinkFooter = document.getElementById("brand-link-to-home");
    const footerContentDivs = document.querySelectorAll(
        ".footer-content-display"
    );
    const staticContentLinks = document.querySelectorAll("a[data-content-id]");
    const alertLinks = document.querySelectorAll('a[data-action="alert"]');
    const homeLinks = [
        brandLinkTop,
        brandLinkFooter,
        ...document.querySelectorAll('a[data-action="showMain"]'),
    ];
    const productCards = document.querySelectorAll(".product-card");
    const cartItemsList = document.getElementById("cart-items");
    const cartTotalDisplay = document.getElementById("cart-total-display");
    const cartTotalValue = document.getElementById("cart-total-value");
    const cartCheckoutBtn = document.getElementById("checkout-btn");
    const clearCartBtn = document.getElementById("clear-cart-btn");
    const allCheckoutBtns = document.querySelectorAll(".js-open-checkout");
    const staticOfferBtnSpecial = document.getElementById(
        "static-offer-checkout-btn"
    );
    const dynamicCartBtnSpecial = document.getElementById(
        "dynamic-cart-checkout-btn-special"
    );
    const zoomContainer = document.querySelector(".zoom-container");
    const zoomImage = document.getElementById("mainImage");
    const zoomLens = document.getElementById("zoomLens");
    const checkoutModalOverlay = document.getElementById(
        "checkout-modal-overlay"
    );
    const checkoutModalContent = checkoutModalOverlay?.querySelector(
        ".modal-content.checkout"
    );
    const checkoutOffersSection = checkoutModalOverlay?.querySelector(".offers");
    const checkoutGenderSelector = document.getElementById(
        "static-offer-gender-selector"
    );
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutSubmitBtn = checkoutForm?.querySelector(".submit-btn");
    const checkoutCloseBtn =
        checkoutModalOverlay?.querySelector(".close-modal-btn");
    const notificationModalOverlay = document.getElementById(
        "notification-modal-overlay"
    );
    const notificationContent = document.getElementById(
        "notification-modal-content"
    );
    const notificationMessage = document.getElementById("notification-message");
    const notificationCloseBtn = document.getElementById(
        "close-notification-modal"
    ); // تم التأكد من وجود ID مطابق
    const modalActionsContainer =
        notificationModalOverlay?.querySelector(".modal-actions");
    const continueShoppingBtn = document.getElementById("continue-shopping-btn");
    const itemNotificationBar = document.getElementById("item-notification-bar");
    const itemNotificationContent = document.getElementById(
        "item-notification-content"
    );
    // const newsletterForm = document.getElementById('newsletter-form'); // لا نحتاج لهذا لأننا نستخدم تفويض الأحداث

    // ===== دوال مساعدة أساسية =====
    const getCartFromLocalStorage = () => {
    /* ... */ try {
            const t = localStorage.getItem(LS_CART_KEY);
            const e = t ? JSON.parse(t) : [];
            return Array.isArray(e) ? e : [];
        } catch (t) {
            return (
                console.error("Error parsing cart from LocalStorage:", t),
                localStorage.removeItem(LS_CART_KEY),
                []
            );
        }
    };
    const saveCartToLocalStorage = (cart) => {
    /* ... */ try {
            localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
        } catch (t) {
            console.error("Error saving cart to LocalStorage:", t);
        }
    };
    const getSelectionFromLocalStorage = (productId, type) =>
        localStorage.getItem(`${LS_SELECTION_PREFIX}${productId}_${type}`);
    const saveSelectionToLocalStorage = (productId, type, value) => {
    /* ... */ const t = `${LS_SELECTION_PREFIX}${productId}_${type}`;
        null != value && void 0 !== value && "" !== value
            ? localStorage.setItem(t, value)
            : localStorage.removeItem(t);
    };
    const clearAllSelections = () =>
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(LS_SELECTION_PREFIX)) localStorage.removeItem(key);
        });
    const hideNotification = () => {
    /* ... */ notificationModalOverlay &&
            (notificationModalOverlay.style.display = "none"),
            clearTimeout(notificationTimeout);
    };
    const showNotification = (
        content,
        type = "info",
        duration = null,
        isHtml = false
    ) => {
    /* ... */ if (
            !notificationModalOverlay ||
            !notificationContent ||
            !notificationMessage ||
            !modalActionsContainer
        )
            return (
                console.error("Notification modal elements missing!"),
                void alert("string" == typeof content ? content : "Notification Error!")
            );
        clearTimeout(notificationTimeout),
            isHtml
                ? ((notificationMessage.innerHTML = content),
                    (modalActionsContainer.style.display = "block"))
                : ((notificationMessage.textContent = content),
                    (modalActionsContainer.style.display = "none")),
            (notificationContent.className =
                "modal-content notification-content " + type),
            (notificationModalOverlay.style.display = "flex"),
            duration &&
            "number" == typeof duration &&
            duration > 0 &&
            (notificationTimeout = setTimeout(hideNotification, duration));
    };
    const showItemNotification = (details, type, duration = 2400) => {
    /* ... */ if (!itemNotificationBar || !itemNotificationContent) {
            const t =
                "updated" === type
                    ? `تم تحديث: ${details.name}`
                    : `تمت إضافة: ${details.quantityAdded} × ${details.name}`;
            return void showNotification(t, "success", 2500);
        }
        clearTimeout(itemNotificationTimeout);
        let t = "";
        (t =
            "updated" === type
                ? `<div class="item-notif-contrnt" style="color:antiquewhite;"><span class="item-notif-line">🔄 تم تحديث الكمية لـ</span><span class="item-notif-line"><strong style="color:azure;"> ( ${details.type || "-"
                } ) </strong></span><span class="item-notif-line"><strong style="color:red;"> ${details.size
                }مل </strong></span><span class="item-notif-line">في السلة إلى</span><span class="item-notif-line"><strong style="color:red;"> ( ${details.totalQuantity
                } ) </strong></span></div>`
                : `<div class="item-notif-contrnt"><span class="item-notif-line">✅ تمت إضافة: </span><span class="item-notif-line"><strong style="color:red;"> ( ${details.quantityAdded
                } ) </strong></span><span class="item-notif-line">من</span><span class="item-notif-line"><strong style="color:azure;"> ( ${details.type || "-"
                } ) </strong></span><span class="item-notif-line"><strong style="color:red;"> ${details.size
                }مل </strong></span><span class="item-notif-line">إلى السلة</span></div>`),
            (itemNotificationContent.innerHTML = t),
            itemNotificationBar.classList.add("visible"),
            (itemNotificationTimeout = setTimeout(hideItemNotification, duration));
    };
    const hideItemNotification = () => {
    /* ... */ itemNotificationBar &&
            itemNotificationBar.classList.remove("visible"),
            clearTimeout(itemNotificationTimeout);
    };
    const showLabelError = (label, message, id, type) => {
    /* ... */ if (!label) return;
        const e = `${id}_${type}`;
        originalLabels[e] || (originalLabels[e] = label.textContent),
            (label.textContent = message),
            label.classList.add("label-error");
    };
    const hideLabelError = (label, id, type) => {
    /* ... */ if (!label) return;
        const e = `${id}_${type}`;
        originalLabels[e] && (label.textContent = originalLabels[e]),
            label.classList.remove("label-error");
    };
    const openSidebar = (sidebar, overlay) => {
    /* ... */ sidebar && sidebar.classList.add("open"),
            overlay && overlay.classList.add("visible");
    };
    const closeSidebar = (sidebar, overlay) => {
    /* ... */ sidebar && sidebar.classList.remove("open"),
            overlay && overlay.classList.remove("visible");
    };
    const closeAllSidebars = () => {
    /* ... */ closeSidebar(mainSidebar, mainSidebarOverlay),
            closeSidebar(cartSidebar, cartSidebarOverlay);
    };
    const hideAllStaticContent = () =>
        footerContentDivs.forEach((div) => {
            if (div) div.style.display = "none";
        });
    const showMainContentArea = () => {
    /* ... */ hideAllStaticContent(),
            mainPageContent && (mainPageContent.style.display = "block"),
            window.scrollTo(0, 0);
    };
    const showSpecificStaticContent = (contentId) => {
    /* ... */ hideAllStaticContent(),
            mainPageContent && (mainPageContent.style.display = "none");
        const t = document.getElementById(contentId);
        t
            ? ((t.style.display = "block"), window.scrollTo(0, 0))
            : showMainContentArea();
    };
    const getPriceBySize = (size, productId) => {
    /* ... */ const t = parseInt(size, 10);
        return isNaN(t)
            ? 0
            : "unisex" === productId
                ? 30 === t
                    ? 50
                    : 50 === t
                        ? 80
                        : 100 === t
                            ? 150
                            : 0
                : 30 === t
                    ? 30
                    : 50 === t
                        ? 50
                        : 100 === t
                            ? 100
                            : 0;
    };
    const getTotalCartQuantity = () => {
    /* ... */ const t = getCartFromLocalStorage();
        return t.reduce((t, e) => t + (e?.quantity || 0), 0);
    };
    const checkCartOfferByTotalQuantity = () => {
    /* ... */ const t = getCartFromLocalStorage(),
            e = getTotalCartQuantity(),
            o = t.reduce((t, e) => t + (e?.quantity || 0) * (e?.price || 0), 0);
        return e >= 10
            ? {
                type: "10_plus_items",
                price: o * DYNAMIC_OFFER_10_PLUS_DISCOUNT_RATE,
                text: "توصيل مجاني + خصم 15%",
            }
            : e >= 5
                ? { type: "5_to_9_items", price: o, text: "توصيل مجاني" }
                : null;
    };
    const buildOrderSummaryHTML = (formData, items, total, offerDetailsText) => {
    /* ... */ const t = items
            .map((t) => {
                const e = (t.price && "number" == typeof t.price ? t.price : 0).toFixed(
                    2
                ),
                    o = t.quantity || 1,
                    a = (t.price && "number" == typeof t.price ? o * t.price : 0).toFixed(
                        2
                    );
                return `<tr><td data-label="العطر/الفئة">${t.name || "-"
                    }</td><td data-label="النوع/الوصف">${t.type || "-"
                    }</td><td data-label="الحجم">${t.size || "?"
                    }مل</td><td data-label="الكمية">${o}</td><td data-label="السعر">${e}د.م</td><td data-label="المجموع">${a}د.م</td></tr>`;
            })
            .join("");
        return `<div class="order-summary-container"><h4>🎉 تم استلام طلبك بنجاح!</h4><p class="thank-you-message">نشكرك على ثقتك. سيتم التواصل معك عبر الهاتف لتأكيد الطلب قريباً.</p><div class="customer-info"><h5>تفاصيل العميل:</h5><p><span class="label">الاسم:</span> ${formData.fullName || "-"
            }</p><p><span class="label">الهاتف:</span> ${formData.phone || "-"
            }</p><p><span class="label">العنوان:</span> ${formData.address || "-"}, ${formData.city || "-"
            }</p><p><span class="label">العرض المطبق:</span> ${offerDetailsText || "لا يوجد"
            }</p><p><span class="label">الملاحظات:</span> ${formData.notes || "لا يوجد"
            }</p></div><hr><div class="cart-item-summary"><h5>ملخص الطلب:</h5><div class="table-responsive-wrapper"><table class="cart-items-table"><thead><tr><th>العطر/الفئة</th><th>النوع/الوصف</th><th>الحجم</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${t}</tbody></table></div></div><hr><div class="final-total"><p>المبلغ الإجمالي للدفع: <span class="total-value">${total.toFixed(
                2
            )}</span> درهم</p></div><hr><div class="newsletter-signup" id="newsletter-section"><h5>انضم إلى قائمتنا البريدية!</h5><p>كن أول من يعرف عن العروض والمنتجات الجديدة.</p><form id="newsletter-form"><input type="text" name="newsletter_name" placeholder="اسمك (اختياري)"><input type="email" name="newsletter_email" placeholder="بريدك الإلكتروني" required><button type="submit">اشتراك</button></form><p id="newsletter-feedback" style="margin-top: 10px; color: green; display: none;"></p></div></div>`;
    };

    // ===== منطق الواجهة وتحديثها =====
    const updateSpecialOfferButtonsVisibility = () => {
    /* ... */ const t = getCartFromLocalStorage().length > 0;
        staticOfferBtnSpecial &&
            dynamicCartBtnSpecial &&
            ((staticOfferBtnSpecial.style.display = t ? "none" : "block"),
                (dynamicCartBtnSpecial.style.display = t ? "block" : "none"));
    };
    const renderCart = () => {
    /* ... */ const t = getCartFromLocalStorage();
        if (
            !cartItemsList ||
            !cartTotalDisplay ||
            !cartTotalValue ||
            !cartCheckoutBtn ||
            !clearCartBtn ||
            !cartCountBadge
        )
            return void console.error("One or more cart UI elements are missing.");
        cartItemsList.innerHTML = "";
        let e = 0,
            o = 0;
        const a = !t || 0 === t.length;
        if (a) cartItemsList.innerHTML = "<li>السلة فارغة حالياً.</li>";
        else
            for (const n of t) {
                if (
                    !(
                        n?.id &&
                        n.name &&
                        "number" == typeof n.quantity &&
                        n.quantity > 0 &&
                        n.size &&
                        "number" == typeof n.price
                    )
                ) {
                    console.warn("Skipping invalid item in cart:", n);
                    continue;
                }
                const i = document.createElement("li"),
                    l = n.quantity * n.price;
                (e += l), (o += n.quantity);
                const d = n.price.toFixed(2),
                    c = l.toFixed(2);
                i.innerHTML = `\n                    <div class="cart-item-details">\n                        <div class="cd1">\n                            <span style="color:black;">${n.type || "غير محدد"
                    }</span>\n                            <span style="color:purple;">(${n.size
                    }مل)</span>\n                            <span style="color:black;">${n.name
                    }</span>\n                        </div>\n                        <br>\n                        <div class="cd2">\n                            <span style="color:red;">${d} د.م</span>\n                            <span style="color:gray;">×</span>\n                            <span style="color:purple;">${n.quantity
                    }</span>\n                            <span style="color:gray;">=</span>\n                            <span style="color:red;">${c} د.م</span>\n                        </div>\n                    </div>\n                    <button type="button" class="delete-item-btn" data-item-id="${n.id
                    }" aria-label="حذف" ${n.name}"></button>\n                 `;
                const r = i.querySelector(".delete-item-btn");
                r &&
                    r.addEventListener("click", (e) => {
                        const o = e.target.dataset.itemId;
                        if (
                            o &&
                            confirm(`هل أنت متأكد من حذف هذا المنتج (${n.name}) من السلة؟`)
                        ) {
                            let e = getCartFromLocalStorage();
                            (e = e.filter((t) => t.id !== o)),
                                saveCartToLocalStorage(e),
                                renderCart(),
                                showNotification("تم حذف المنتج من السلة.", "success", 2500);
                        }
                    }),
                    cartItemsList.appendChild(i);
            }
        (cartTotalValue.textContent = e.toFixed(2)),
            (cartTotalDisplay.style.display = a ? "none" : "block"),
            (cartCheckoutBtn.style.display = a ? "none" : "inline-block"),
            (clearCartBtn.style.display = a ? "none" : "inline-block"),
            (cartCountBadge.textContent = o),
            (cartCountBadge.style.display = a ? "none" : "inline-block"),
            updateSpecialOfferButtonsVisibility();
    };
    function setupSearchableSelect(container) {
    /* ... */ const t = container.querySelector(".searchable-select-input"),
            e = container.querySelector(".custom-options-list"),
            o = t?.dataset.targetSelect,
            a = o ? document.getElementById(o) : null;
        if (!t || !e || !a) return;
        e.innerHTML = "";
        const n = document.createDocumentFragment();
        Array.from(a.options).forEach((o) => {
            if (!o.value || o.disabled) return;
            const i = document.createElement("div");
            (i.className = "custom-option"),
                (i.textContent = o.textContent),
                (i.dataset.value = o.value),
                i.addEventListener("mousedown", (n) => {
                    n.preventDefault(),
                        (t.value = o.textContent),
                        (a.value = o.value),
                        e.classList.remove("active"),
                        a.dispatchEvent(new Event("change", { bubbles: !0 }));
                }),
                n.appendChild(i);
        }),
            e.appendChild(n);
        const i = e.querySelectorAll(".custom-option");
        function l(t) {
            const e = t.toLowerCase().trim();
            i.forEach((t) => {
                const o = t.textContent.toLowerCase();
                t.classList.toggle("hidden", !o.includes(e));
            });
        }
        t.addEventListener("focus", () => {
            l(t.value), e.classList.add("active");
        }),
            t.addEventListener("blur", () => {
                setTimeout(() => {
                    if (!container.contains(document.activeElement)) {
                        e.classList.remove("active");
                        const o = Array.from(a.options).find((t) => t.value === a.value);
                        a.value && (!o || t.value !== o.textContent)
                            ? o
                                ? (t.value = o.textContent)
                                : ((t.value = ""),
                                    (a.value = ""),
                                    a.dispatchEvent(new Event("change", { bubbles: !0 })))
                            : a.value || "" === t.value || (t.value = "");
                    }
                }, 150);
            }),
            t.addEventListener("input", () => {
                l(t.value),
                    e.classList.contains("active") || e.classList.add("active"),
                    "" === t.value.trim() &&
                    "" !== a.value &&
                    ((a.value = ""),
                        a.dispatchEvent(new Event("change", { bubbles: !0 })));
            });
    }
    const loadSavedSelections = (card) => {
    /* ... */ const t = card.dataset.productId;
        if (!t) return;
        const e = getSelectionFromLocalStorage(t, "type"),
            o = getSelectionFromLocalStorage(t, "size"),
            a = card.querySelector(".perfume-type-select"),
            n = card.querySelector(".searchable-select-input"),
            i = card.querySelectorAll(`input[type="radio"][name="size-${t}"]`),
            l = card.querySelector(".product-price-display .price-value"),
            d = card.querySelector(`label[for="perfume-type-${t}"]`),
            c = card
                .querySelector(".size-options")
                ?.closest(".form-group")
                ?.querySelector("label");
        if (a && n && ((a.value = ""), (n.value = ""), e)) {
            const i = Array.from(a.options).find((t) => t.value === e);
            i
                ? ((a.value = e), (n.value = i.textContent))
                : saveSelectionToLocalStorage(t, "type", null);
        }
        d && hideLabelError(d, t, "type");
        let r = !1,
            s = 0;
        i.forEach((e) => {
            (e.checked = o && e.value === o),
                e.checked && ((r = !0), (s = getPriceBySize(o, t)));
        }),
            o && !r && saveSelectionToLocalStorage(t, "size", null),
            l && (l.textContent = s > 0 ? s.toFixed(2) : "0.00"),
            c && hideLabelError(c, t, "size");
    };
    const resetProductCard = (card) => {
    /* ... */ const t = card.dataset.productId;
        if (!t) return;
        const e = card.querySelector(".perfume-type-select"),
            o = card.querySelector(".searchable-select-input"),
            a = card.querySelectorAll(`input[type="radio"][name="size-${t}"]`),
            n = card.querySelector(".quantity-display"),
            i = card.querySelector(".product-price-display .price-value"),
            l = card.querySelector(`label[for="perfume-type-${t}"]`),
            d = card
                .querySelector(".size-options")
                ?.closest(".form-group")
                ?.querySelector("label"),
            c = card.querySelector(".add-to-cart-btn");
        o && (o.value = ""),
            e && (e.value = ""),
            a.forEach((t) => {
                t.checked = !1;
            }),
            n && (n.textContent = "1"),
            i && (i.textContent = "0.00"),
            l && hideLabelError(l, t, "type"),
            d && hideLabelError(d, t, "size"),
            c && ((c.textContent = "أضف للسلة"), (c.disabled = !1)),
            saveSelectionToLocalStorage(t, "type", null),
            saveSelectionToLocalStorage(t, "size", null);
    };
    const resetAllProductCards = () => productCards.forEach(resetProductCard);
    const clearCartAndSelections = () => {
    /* ... */ localStorage.removeItem(LS_CART_KEY),
            clearAllSelections(),
            resetAllProductCards(),
            renderCart();
    };

    // ===== ربط الأحداث =====
    document
        .querySelectorAll(".searchable-select-container")
        .forEach(setupSearchableSelect);
    productCards.forEach((card) => {
    /* ... الكود الكامل لربط أحداث البطاقة ... */ const t =
            card.dataset.productId;
        if (!t) return;
        const e = card.querySelector(".perfume-type-select"),
            o = card.querySelector(".size-options"),
            a = card.querySelector(".add-to-cart-btn"),
            n = card.querySelector(".quantity-display"),
            i = card.querySelector(".quantity-decrease"),
            l = card.querySelector(".quantity-increase"),
            d = card.querySelector(".product-price-display .price-value"),
            c = card.querySelector(`label[for="perfume-type-${t}"]`),
            r = o?.closest(".form-group")?.querySelector("label");
        if (!a || !n || !i || !l || !e || !o || !d)
            return void console.warn(
                `Skipping event binding for product card ${t} due to missing elements.`
            );
        i.addEventListener("click", () => {
            let t = parseInt(n.textContent);
            !isNaN(t) && t > 1 && (n.textContent = t - 1);
        }),
            l.addEventListener("click", () => {
                let t = parseInt(n.textContent);
                n.textContent = isNaN(t) ? 1 : t + 1;
            }),
            e.addEventListener("change", (e) => {
                saveSelectionToLocalStorage(t, "type", e.target.value),
                    c && hideLabelError(c, t, "type");
            }),
            o.addEventListener("change", (o) => {
                if (
                    "radio" === o.target.type &&
                    o.target.checked &&
                    o.target.name === `size-${t}`
                ) {
                    const a = o.target.value;
                    saveSelectionToLocalStorage(t, "size", a);
                    const n = getPriceBySize(a, t);
                    d && (d.textContent = n > 0 ? n.toFixed(2) : "0.00"),
                        r && hideLabelError(r, t, "size");
                }
            }),
            a.addEventListener("click", () => {
                c && hideLabelError(c, t, "type"), r && hideLabelError(r, t, "size");
                const o = a.dataset.productName || `منتج ${t}`,
                    i = e.value,
                    l = card.querySelector(
                        `input[type="radio"][name="size-${t}"]:checked`
                    ),
                    d = parseInt(n.textContent) || 1;
                let s = !0;
                if (
                    (i ||
                        (c && showLabelError(c, "⚠ الرجاء اختيار النوع", t, "type"),
                            (s = !1)),
                        l ||
                        (r && showLabelError(r, "⚠ الرجاء اختيار الحجم", t, "size"),
                            (s = !1)),
                        !s)
                )
                    return;
                const u = l.value,
                    p = getPriceBySize(u, t);
                if (p <= 0)
                    return void showNotification(
                        "حدث خطأ في تحديد السعر. يرجى المحاولة مرة أخرى.",
                        "error"
                    );
                const m =
                    e.selectedIndex >= 0
                        ? e.options[e.selectedIndex].textContent.trim()
                        : i;
                let g = getCartFromLocalStorage();
                const h = `${i}-${u}`;
                let f = g.findIndex((t) => t?.key === h),
                    y = {};
                let v = "added";
                try {
                    f > -1
                        ? ((g[f].quantity += d),
                            (g[f].price = p),
                            (y = { name: o, type: m, size: u, totalQuantity: g[f].quantity }),
                            (v = "updated"))
                        : (g.push({
                            id: `${t}-${h}-${Date.now()}`,
                            key: h,
                            productId: t,
                            name: o,
                            type: m,
                            value: i,
                            size: u,
                            quantity: d,
                            price: p,
                        }),
                            (y = { name: o, type: m, size: u, quantityAdded: d, price: p }),
                            (v = "added")),
                        saveCartToLocalStorage(g),
                        renderCart(),
                        resetProductCard(card),
                        showItemNotification(y, v),
                        (a.textContent = "✓ تمت الإضافة"),
                        (a.disabled = !0),
                        setTimeout(() => {
                            a.disabled && ((a.textContent = "أضف للسلة"), (a.disabled = !1));
                        }, 1500);
                } catch (t) {
                    console.error("Error adding item to cart:", t),
                        showNotification("حدث خطأ أثناء إضافة المنتج للسلة.", "error");
                }
            }),
            loadSavedSelections(card),
            n && (n.textContent = "1");
    });
    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
      /* ... */ confirm("هل أنت متأكد من رغبتك في إفراغ السلة بالكامل؟") &&
                (clearCartAndSelections(),
                    showNotification("تم إفراغ سلة المشتريات بنجاح.", "success", 3e3),
                    closeSidebar(cartSidebar, cartSidebarOverlay));
        });
    }
    if (allCheckoutBtns?.length > 0) {
        allCheckoutBtns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
        /* ... */ checkoutTriggerType =
                    e.target.closest(".js-open-checkout")?.dataset.triggerType || null;
                if (checkoutTriggerType) {
                    const t = getCartFromLocalStorage();
                    if ("dynamic-cart" === checkoutTriggerType && 0 === t.length)
                        return void showNotification(
                            "سلة المشتريات فارغة. الرجاء إضافة منتجات أولاً.",
                            "error",
                            3500
                        );
                    if (
                        checkoutModalOverlay &&
                        checkoutOffersSection &&
                        checkoutGenderSelector &&
                        checkoutForm &&
                        checkoutSubmitBtn
                    ) {
                        const t = "static-offer" === checkoutTriggerType;
                        if (
                            ((checkoutOffersSection.style.display = t ? "flex" : "none"),
                                (checkoutGenderSelector.style.display = t ? "block" : "none"),
                                t)
                        ) {
                            const e = checkoutOffersSection.querySelector(
                                'input[value="5_pack"]'
                            );
                            e && (e.checked = !0),
                                checkoutGenderSelector
                                    .querySelectorAll('input[name="offer_gender"]')
                                    .forEach((t) => {
                                        t.checked = !1;
                                    });
                            const o = checkoutGenderSelector.querySelector("label.required");
                            o && hideLabelError(o, "staticOffer", "gender");
                        }
                        let e;
                        if ("static-offer" === checkoutTriggerType)
                            checkoutSubmitBtn.textContent = "أكد الطلب الآن (توصيل مجاني)";
                        else if ("dynamic-cart" === checkoutTriggerType) {
                            const t = getTotalCartQuantity();
                            checkoutSubmitBtn.textContent =
                                t >= 10
                                    ? "أكد الطلب الآن (توصيل مجاني + خصم 15%)"
                                    : t >= 5
                                        ? "أكد الطلب الآن (توصيل مجاني)"
                                        : "أكد الطلب الآن";
                        } else checkoutSubmitBtn.textContent = "أكد الطلب الآن";
                        checkoutForm.querySelectorAll(".invalid-input").forEach((t) => {
                            t.classList.remove("invalid-input");
                        }),
                            (checkoutModalOverlay.style.display = "flex"),
                            closeAllSidebars();
                    } else console.error("Checkout modal elements are missing.");
                } else console.warn("Checkout trigger type not identified.");
            });
        });
    }
    if (checkoutCloseBtn) {
        checkoutCloseBtn.addEventListener("click", () => {
      /* ... */ checkoutModalOverlay &&
                (checkoutModalOverlay.style.display = "none");
        });
    }
    if (checkoutModalOverlay) {
        checkoutModalOverlay.addEventListener("click", (e) => {
      /* ... */ e.target === checkoutModalOverlay &&
                (checkoutModalOverlay.style.display = "none");
        });
    }

    // --- ربط حدث إرسال نموذج الدفع (الكود المصحح) ---
    if (checkoutForm) {
        console.log("DEBUG: Checkout form event listener is attached.");
        checkoutForm.addEventListener("submit", (e) => {
            console.log("DEBUG: Submit button clicked! Event listener triggered.");
            e.preventDefault();
            console.log("DEBUG: Default form submission prevented.");

            const formData = {
        /* ... جمع البيانات ... */ fullName: document
                    .getElementById("fullName")
                    ?.value.trim(),
                phone: document.getElementById("phone")?.value.trim(),
                address: document.getElementById("address")?.value.trim(),
                city: document.getElementById("city")?.value.trim(),
                notes: document.getElementById("notes")?.value.trim() || "لا يوجد",
            };
            console.log("DEBUG: formData collected:", formData);
            let isFormValid = true;
            ["fullName", "phone", "address", "city"].forEach((id) => {
        /* ... التحقق الأساسي ... */ const t = document.getElementById(id);
                t
                    ? (t.classList.remove("invalid-input"),
                        formData[id] ||
                        (t.classList.add("invalid-input"), (isFormValid = !1)))
                    : (console.error(`Input element with ID "${id}" not found.`),
                        (isFormValid = !1));
            });
            console.log(
                "DEBUG: Basic form validation complete. Is valid?",
                isFormValid
            );
            let staticOfferData = null;
            const genderLabel =
                checkoutGenderSelector?.querySelector("label.required");
            if (genderLabel) hideLabelError(genderLabel, "staticOffer", "gender");
            if (checkoutTriggerType === "static-offer") {
        /* ... التحقق للعرض الثابت ... */ const t =
                    checkoutModalOverlay?.querySelector(
                        'input[name="static_offer_bundle"]:checked'
                    ),
                    e = checkoutModalOverlay?.querySelector(
                        'input[name="offer_gender"]:checked'
                    );
                t ||
                    (console.error("Static offer bundle not selected."),
                        (isFormValid = !1)),
                    e ||
                    (genderLabel &&
                        showLabelError(
                            genderLabel,
                            "⚠ الرجاء اختيار الفئة",
                            "staticOffer",
                            "gender"
                        ),
                        (isFormValid = !1)),
                    isFormValid &&
                    t &&
                    e &&
                    (staticOfferData = {
                        bundleType: t.value,
                        genderType: e.value,
                        price: parseFloat(t.dataset.price || "0"),
                    });
            }
            console.log(
                "DEBUG: Static offer validation complete. Static data:",
                staticOfferData
            );

            if (!isFormValid) {
                console.log("DEBUG: Form is invalid, stopping submission.");
                showNotification(
                    "يرجى ملء جميع الحقول المطلوبة وتصحيح الأخطاء.",
                    "error",
                    4000
                );
                const firstInvalid = checkoutForm.querySelector(
                    ".invalid-input, .label-error"
                );
                firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
            }
            console.log("DEBUG: Form is valid, proceeding.");

            try {
                let finalTotal = 0;
                let finalItems = [];
                let finalOfferText = null;

                if (checkoutTriggerType === "static-offer" && staticOfferData) {
          /* ... تجهيز بيانات العرض الثابت ... */ finalTotal =
                        staticOfferData.price;
                    const t = staticOfferData.bundleType === "5_pack" ? 5 : 10,
                        e = `${staticOfferData.genderType}_${t}`,
                        o = STATIC_PERFUMES[e];
                    if (!o || 0 === o.length)
                        throw new Error(`قائمة العطور المحددة (${e}) غير موجودة أو فارغة.`);
                    (finalItems = o.map((e) => ({
                        name: e,
                        type: `باقة ${t} الثابتة`,
                        size: "30",
                        quantity: 1,
                        price: finalTotal / t,
                    }))),
                        (finalOfferText = `باقة ${t} (${"men" === staticOfferData.genderType ? "رجالية" : "نسائية"
                            }) - توصيل مجاني`),
                        console.log(
                            "DEBUG: Prepared static order items and total.",
                            finalItems,
                            finalTotal
                        );
                } else if (checkoutTriggerType === "dynamic-cart") {
          /* ... تجهيز بيانات السلة الديناميكية ... */ const t =
                        checkCartOfferByTotalQuantity(),
                        e = getCartFromLocalStorage().filter(
                            (t) => t?.id && t.quantity > 0 && "number" == typeof t.price
                        );
                    if (0 === e.length)
                        throw new Error("السلة أصبحت فارغة. لا يمكن إتمام الطلب.");
                    (finalItems = e),
                        t
                            ? ((finalTotal = t.price), (finalOfferText = t.text))
                            : ((finalTotal = e.reduce((t, e) => t + e.quantity * e.price, 0)),
                                (finalOfferText = "لا يوجد عرض خاص")),
                        console.log(
                            "DEBUG: Prepared dynamic cart order items and total.",
                            finalItems,
                            finalTotal
                        );
                } else {
                    throw new Error(`نوع تفعيل غير معروف: ${checkoutTriggerType}`);
                }

                const orderData = {
                    customerInfo: formData,
                    items: finalItems,
                    totalAmount: finalTotal,
                    offerApplied: finalOfferText,
                    orderType: checkoutTriggerType,
                };
                console.log("DEBUG: Final orderData object created:", orderData);

                if (checkoutSubmitBtn) {
                    checkoutSubmitBtn.disabled = true;
                    checkoutSubmitBtn.textContent = "جاري إرسال الطلب...";
                    console.log("DEBUG: Submit button disabled.");
                } else {
                    console.error("DEBUG: Checkout submit button not found!");
                }

                console.log("DEBUG: Attempting to fetch:", submitOrderUrl);

                fetch(submitOrderUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderData),
                })
                    .then((response) => {
                        console.log(
                            "DEBUG: Received response from server. Status:",
                            response.status
                        );
                        return response
                            .json()
                            .then((data) => ({
                                ok: response.ok,
                                status: response.status,
                                data,
                            }));
                    })
                    .then(({ ok, status, data }) => {
                        console.log(
                            "DEBUG: Parsed server response. ok:",
                            ok,
                            "data:",
                            data
                        );
                        if (!ok) throw new Error(data.message || `خطأ ${status}`);
                        console.log("DEBUG: Server returned success.");
                        const orderSummaryHtml = buildOrderSummaryHTML(
                            formData,
                            finalItems,
                            finalTotal,
                            finalOfferText
                        );
                        showNotification(orderSummaryHtml, "success", null, true);
                        if (checkoutModalOverlay)
                            checkoutModalOverlay.style.display = "none";
                        checkoutForm.reset();
                        if (checkoutTriggerType === "dynamic-cart")
                            clearCartAndSelections();
                    })
                    .catch((error) => {
                        console.error("DEBUG: Fetch Error:", error);
                        showNotification(
                            `فشل إرسال الطلب: ${error.message}`,
                            "error",
                            6000
                        );
                    })
                    .finally(() => {
                        console.log("DEBUG: Fetch finally block executed.");
                        if (checkoutSubmitBtn) {
                            checkoutSubmitBtn.disabled = false;
                            if (checkoutTriggerType === "static-offer") {
                                checkoutSubmitBtn.textContent = "أكد الطلب الآن (توصيل مجاني)";
                            } else {
                                const totalQuantity = getTotalCartQuantity();
                                checkoutSubmitBtn.textContent =
                                    totalQuantity >= 10
                                        ? "أكد الطلب الآن (توصيل مجاني + خصم 15%)"
                                        : totalQuantity >= 5
                                            ? "أكد الطلب الآن (توصيل مجاني)"
                                            : "أكد الطلب الآن";
                            }
                            console.log("DEBUG: Submit button re-enabled.");
                        }
                    });
            } catch (error) {
                console.error(
                    "DEBUG: Error preparing order data or unknown trigger type:",
                    error
                );
                showNotification(
                    `حدث خطأ أثناء تجهيز الطلب: ${error.message}`,
                    "error",
                    5000
                );
                if (checkoutSubmitBtn) {
                    checkoutSubmitBtn.disabled = false;
                    if (checkoutTriggerType === "static-offer") {
                        checkoutSubmitBtn.textContent = "أكد الطلب الآن (توصيل مجاني)";
                    } else {
                        const totalQuantity = getTotalCartQuantity();
                        checkoutSubmitBtn.textContent =
                            totalQuantity >= 10
                                ? "أكد الطلب الآن (توصيل مجاني + خصم 15%)"
                                : totalQuantity >= 5
                                    ? "أكد الطلب الآن (توصيل مجاني)"
                                    : "أكد الطلب الآن";
                    }
                }
            }
        });
    } else {
        console.error("DEBUG: Checkout form element (#checkout-form) not found!");
    }

    // --- ربط أحداث التنقل ---
    staticContentLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
      /* ... */ e.preventDefault();
            const t = link.dataset.contentId;
            t && (showSpecificStaticContent(t), closeAllSidebars());
        });
    });
    alertLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
      /* ... */ e.preventDefault();
            const t = link.dataset.message;
            t && alert(t), closeAllSidebars();
        });
    });
    homeLinks.forEach((link) => {
        if (link) {
            link.addEventListener("click", (e) => {
        /* ... */ e.preventDefault(), showMainContentArea(), closeAllSidebars();
            });
        }
    });

    // --- ربط أحداث الأشرطة الجانبية ---
    if (mainSidebarToggle) {
        mainSidebarToggle.addEventListener("click", (e) => {
      /* ... */ e.stopPropagation(),
                closeSidebar(cartSidebar, cartSidebarOverlay),
                openSidebar(mainSidebar, mainSidebarOverlay);
        });
    }
    if (cartSidebarToggle) {
        cartSidebarToggle.addEventListener("click", (e) => {
      /* ... */ e.stopPropagation(),
                closeSidebar(mainSidebar, mainSidebarOverlay),
                openSidebar(cartSidebar, cartSidebarOverlay);
        });
    }
    sidebarCloseButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
      /* ... */ const t = btn.dataset.target;
            "mainSidebar" === t
                ? closeSidebar(mainSidebar, mainSidebarOverlay)
                : "cartSidebar" === t && closeSidebar(cartSidebar, cartSidebarOverlay);
        });
    });
    [mainSidebarOverlay, cartSidebarOverlay].forEach((overlay) => {
        if (overlay) {
            overlay.addEventListener("click", () => {
        /* ... */ const t = overlay.dataset.target;
                "mainSidebar" === t
                    ? closeSidebar(mainSidebar, mainSidebarOverlay)
                    : "cartSidebar" === t &&
                    closeSidebar(cartSidebar, cartSidebarOverlay);
            });
        }
    });

    // --- ربط أحداث الإشعارات ---
    // if (notificationCloseBtn) { notificationCloseBtn.addEventListener('click', hideNotification); } // لا يوجد زر إغلاق ID#notificationCloseBtn
    if (notificationModalOverlay) {
        notificationModalOverlay.addEventListener("click", (event) => {
            // --- المشكلة المحتملة هنا ---
            // إذا كان زر الإغلاق داخل #notification-modal-content ليس له ID='close-notification-modal'
            // أو إذا لم يكن لديه الكلاس 'close-modal-btn'
            // فإن النقر عليه لن يغلق النافذة باستخدام event.target.closest()
            const closeButton =
                notificationModalOverlay.querySelector(".close-modal-btn"); // محاولة إيجاد زر الإغلاق
            if (
                event.target === notificationModalOverlay ||
                (closeButton &&
                    event.target.closest(".close-modal-btn") === closeButton)
            ) {
                hideNotification();
            }
            if (event.target.id === "continue-shopping-btn") {
                hideNotification();
            }
        });
    }

    // --- ربط حدث نموذج النشرة ---
    if (notificationModalOverlay) {
        console.log("DEBUG: Newsletter listener attached to overlay.");
        notificationModalOverlay.addEventListener("submit", (e) => {
            console.log(
                "DEBUG: Submit event captured on overlay. Target element:",
                e.target
            );
            if (e.target.id === "newsletter-form") {
                console.log("DEBUG: Newsletter form submission detected!");
                e.preventDefault();
                console.log("DEBUG: Newsletter default submission prevented.");
                const emailInput = e.target.querySelector('input[type="email"]');
                const nameInput = e.target.querySelector(
                    'input[type="text"][name="newsletter_name"]'
                );
                const feedbackP = e.target.parentElement.querySelector(
                    "#newsletter-feedback"
                );
                const submitButton = e.target.querySelector('button[type="submit"]');
                const email = emailInput?.value.trim();
                const name = nameInput?.value.trim() || null;
                console.log(
                    "DEBUG: Newsletter data collected. Email:",
                    email,
                    "Name:",
                    name
                );
                if (!email) {
          /* ... معالجة خطأ البريد الفارغ ... */ console.log(
                    "DEBUG: Newsletter email is empty."
                );
                    if (
                        feedbackP &&
                        ((feedbackP.textContent = "الرجاء إدخال البريد الإلكتروني."),
                            (feedbackP.style.color = "red"),
                            (feedbackP.style.display = "block"))
                    )
                        return;
                }
                if (feedbackP) feedbackP.style.display = "none";
                if (submitButton) submitButton.disabled = true;
                console.log("DEBUG: Attempting to fetch (newsletter):", subscribeUrl);

                fetch(subscribeUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, name: name }),
                })
                    .then((response) => {
                        console.log(
                            "DEBUG: Received newsletter response. Status:",
                            response.status
                        );
                        return response
                            .json()
                            .then((data) => ({
                                ok: response.ok,
                                status: response.status,
                                data,
                            }));
                    })
                    .then(({ ok, status, data }) => {
                        console.log(
                            "DEBUG: Parsed newsletter response. ok:",
                            ok,
                            "data:",
                            data
                        );
                        if (!ok) throw new Error(data.message || `خطأ ${status}`);
                        console.log("DEBUG: Newsletter server returned success.");
                        if (feedbackP) {
                            feedbackP.textContent = data.message || "شكراً لاشتراكك!";
                            feedbackP.style.color = "green";
                            feedbackP.style.display = "block";
                        }
                        e.target.reset();
                    })
                    .catch((error) => {
                        console.error("DEBUG: Newsletter Fetch Error:", error);
                        if (feedbackP) {
                            feedbackP.textContent = `خطأ: ${error.message}`;
                            feedbackP.style.color = "red";
                            feedbackP.style.display = "block";
                        }
                    })
                    .finally(() => {
                        console.log("DEBUG: Newsletter fetch finally block executed.");
                        if (submitButton) submitButton.disabled = false;
                    });
            } else {
                console.log(
                    "DEBUG: Submit event target was NOT #newsletter-form. Target ID:",
                    e.target.id
                );
            }
        });
    } else {
        console.error("DEBUG: Notification modal overlay not found!");
    }

    // --- ربط حدث تكبير الصورة ---
    if (zoomContainer && zoomImage && zoomLens) {
    /* ... كود التكبير - سليم ... */ const calculateZoom = (e) => {
            zoomLens.style.visibility = "visible";
            const containerRect = zoomContainer.getBoundingClientRect();
            const imageRect = zoomImage.getBoundingClientRect();
            if (imageRect.width === 0 || imageRect.height === 0) {
                zoomLens.style.visibility = "hidden";
                return;
            }
            const lensRatioX = zoomLens.offsetWidth / imageRect.width;
            const lensRatioY = zoomLens.offsetHeight / imageRect.height;
            const bgWidth = imageRect.width / lensRatioX;
            const bgHeight = imageRect.height / lensRatioY;
            zoomLens.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
            let x = e.clientX - containerRect.left;
            let y = e.clientY - containerRect.top;
            let lensX = x - zoomLens.offsetWidth / 2;
            let lensY = y - zoomLens.offsetHeight / 2;
            lensX = Math.max(
                0,
                Math.min(lensX, containerRect.width - zoomLens.offsetWidth)
            );
            lensY = Math.max(
                0,
                Math.min(lensY, containerRect.height - zoomLens.offsetHeight)
            );
            zoomLens.style.left = `${lensX}px`;
            zoomLens.style.top = `${lensY}px`;
            const bgPosX =
                (lensX / (containerRect.width - zoomLens.offsetWidth)) *
                (bgWidth - zoomLens.offsetWidth);
            const bgPosY =
                (lensY / (containerRect.height - zoomLens.offsetHeight)) *
                (bgHeight - zoomLens.offsetHeight);
            zoomLens.style.backgroundImage = `url(${zoomImage.src})`;
            zoomLens.style.backgroundPosition = `-${bgPosX}px -${bgPosY}px`;
        };
        zoomContainer.addEventListener("mousemove", calculateZoom);
        zoomContainer.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                calculateZoom(e.touches[0]);
            }
        });
        zoomContainer.addEventListener("mouseleave", () => {
            zoomLens.style.visibility = "hidden";
        });
        zoomContainer.addEventListener("touchend", () => {
            zoomLens.style.visibility = "hidden";
        });
        zoomLens.style.backgroundImage = `url(${zoomImage.src})`;
    }

    // ===== التهيئة الأولية =====
    renderCart();
    console.log("Shop initialization complete.");
});
