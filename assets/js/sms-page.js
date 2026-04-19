document.addEventListener("DOMContentLoaded", function () {
    const DEFAULT_SMS_TEMPLATES = {
        welcome: "স্বাগতম! {name}, আমাদের জুয়েলারি শপে আপনাকে স্বাগতম। বিশেষ ছাড় পেতে ভিজিট করুন। ধন্যবাদ।\nনিউ ক্যামেলিয়া জুয়েলার্স",
        purchase: "প্রিয় {name}, আপনার ক্রয় সফলভাবে সম্পন্ন হয়েছে। পণ্য: {item}, ক্যারেট: {karat}, ওজন: {vori} ভরি, মূল্য: {amount} টাকা। আমাদের সাথে থাকার জন্য ধন্যবাদ।\nনিউ ক্যামেলিয়া জুয়েলার্স",
        sell: "প্রিয় {name}, আপনার বিক্রয় সফলভাবে সম্পন্ন হয়েছে। পণ্য: {item}, ক্যারেট: {karat}, ওজন: {vori} ভরি, মূল্য: {amount} টাকা। সোনার সঠিক মূল্য পেতে আমাদের সাথে থাকুন।\nনিউ ক্যামেলিয়া জুয়েলার্স",
        offer: "বিশেষ অফার! {name}, সোনার দাম কমেছে। আজই ভিজিট করুন এবং ১০% ছাড় নিন। অফার সীমিত সময়ের জন্য।\nনিউ ক্যামেলিয়া জুয়েলার্স",
        reminder: "পেমেন্ট রিমাইন্ডার: {name}, আপনার বাকি পরিশোধের তারিখ এসে গেছে। দয়া করে শীঘ্রই পরিশোধ করুন। ধন্যবাদ।\nনিউ ক্যামেলিয়া জুয়েলার্স",
        festival: "শুভ ঈদ! {name}, আপনার এবং আপনার পরিবারের জন্য শুভ কামনা। বিশেষ অফার পেতে আমাদের শোরুমে আসুন।\nনিউ ক্যামেলিয়া জুয়েলার্স"
    };
    const TEMPLATE_LABELS = {
        welcome: "স্বাগতম এসএমএস",
        purchase: "ক্রয় নিশ্চিতকরণ",
        sell: "বিক্রয় নিশ্চিতকরণ",
        offer: "অফার ও প্রচারণা",
        reminder: "পেমেন্ট রিমাইন্ডার",
        festival: "শুভেচ্ছা বার্তা"
    };

    const state = {
        balance: 0,
        gatewayStatusLoaded: false,
        gatewayConfigured: false,
        templates: { ...DEFAULT_SMS_TEMPLATES },
        recentMessages: [],
        customers: []
    };

    const dom = {
        balanceAmount: document.querySelector(".balance-amount"),
        gatewayStatus: document.getElementById("gatewayStatus"),
        customerSelect: document.getElementById("customerSelect"),
        phoneNumber: document.getElementById("phoneNumber"),
        templateSelect: document.getElementById("templateSelect"),
        smsMessage: document.getElementById("smsMessage"),
        charCounter: document.getElementById("charCounter"),
        smsCount: document.getElementById("smsCount"),
        recentContainer: document.getElementById("recentContainer"),
        sendBtn: document.getElementById("sendBtn"),
        resultModal: document.getElementById("resultModal"),
        modalIcon: document.getElementById("modalIcon"),
        modalTitle: document.getElementById("modalTitle"),
        modalText: document.getElementById("modalText")
    };

    init();

    async function init() {
        updateCharacterCount();
        loadCustomerFallback();

        try {
            const overview = await withTimeout(window.appApiFetch("/sms/overview"), 4000);
            state.balance = Number(overview.balance) || 0;
            state.gatewayStatusLoaded = true;
            state.gatewayConfigured = Boolean(overview.gatewayConfigured);
            state.templates = {
                ...DEFAULT_SMS_TEMPLATES,
                ...(overview.templates || {})
            };
            state.recentMessages = overview.recentMessages || [];
            state.customers = overview.customers || [];
            renderBalance();
            renderGatewayStatus();
            populateTemplates();
            populateCustomers();
            renderRecentMessages();
        } catch (error) {
            state.gatewayStatusLoaded = false;
            state.templates = { ...DEFAULT_SMS_TEMPLATES };
            renderBalance();
            renderGatewayStatus();
            populateTemplates();
            await loadCustomerFallback();
            renderRecentMessages();
            showModal("error", "সংযোগ হয়নি", error.message);
        }
    }

    function withTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise(function (_resolve, reject) {
                setTimeout(function () {
                    reject(new Error("SMS overview load timeout."));
                }, timeoutMs);
            })
        ]);
    }

    async function loadCustomerFallback() {
        try {
            const customers = await window.appApiFetch("/customers");
            state.customers = (customers || []).map(function (customer) {
                return {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    lastAction: customer.lastAction,
                    lastTransactionType: customer.lastTransactionType,
                    lastTransactionAmount: customer.lastTransactionAmount,
                    lastTransactionVori: customer.lastTransactionVori,
                    lastTransactionWeight: customer.lastTransactionWeight,
                    lastTransactionItemName: customer.lastTransactionItemName,
                    lastTransactionBrand: customer.lastTransactionBrand,
                    lastTransactionKarat: customer.lastTransactionKarat
                };
            });
            populateCustomers();
        } catch (_error) {
            state.customers = [];
            populateCustomers();
        }
    }

    function populateCustomers() {
        let html = '<option value="">-- গ্রাহক নির্বাচন করুন --</option>';

        state.customers.forEach(function (customer) {
            html += `
                <option
                    value="${window.escapeHtml(customer.id)}"
                    data-phone="${window.escapeHtml(customer.phone)}"
                    data-name="${window.escapeHtml(customer.name)}"
                    data-amount="${window.escapeHtml(customer.lastTransactionAmount || 0)}"
                    data-vori="${window.escapeHtml(customer.lastTransactionVori || 0)}"
                    data-weight="${window.escapeHtml(customer.lastTransactionWeight || 0)}"
                    data-item="${window.escapeHtml(customer.lastTransactionItemName || "")}"
                    data-brand="${window.escapeHtml(customer.lastTransactionBrand || "")}"
                    data-karat="${window.escapeHtml(customer.lastTransactionKarat || "")}"
                    data-type="${window.escapeHtml(customer.lastTransactionType || "")}"
                    data-action="${window.escapeHtml(customer.lastAction || "")}"
                >${window.escapeHtml(customer.name)} (${window.escapeHtml(customer.phone)})</option>
            `;
        });

        dom.customerSelect.innerHTML = html;
    }

    function populateTemplates() {
        const orderedKeys = ["welcome", "purchase", "sell", "offer", "reminder", "festival"];
        const templateKeys = orderedKeys
            .filter(function (key) {
                return state.templates[key];
            })
            .concat(Object.keys(state.templates).filter(function (key) {
                return !orderedKeys.includes(key);
            }));

        let html = '<option value="">-- টেমপ্লেট নির্বাচন করুন --</option>';

        templateKeys.forEach(function (key) {
            const label = TEMPLATE_LABELS[key] || key;
            html += `<option value="${window.escapeHtml(key)}">${window.escapeHtml(label)}</option>`;
        });

        dom.templateSelect.innerHTML = html;
    }

    function renderBalance() {
        dom.balanceAmount.innerHTML = `${Number(state.balance || 0).toLocaleString("en-US")} <span class="balance-unit">SMS</span>`;
    }

    function renderGatewayStatus() {
        if (!dom.gatewayStatus) {
            return;
        }

        if (!state.gatewayStatusLoaded) {
            dom.gatewayStatus.className = "gateway-status not-configured";
            dom.gatewayStatus.innerHTML = '<i class="fas fa-circle-info"></i> SMS API status লোড হয়নি';
            return;
        }

        if (state.gatewayConfigured) {
            dom.gatewayStatus.className = "gateway-status configured";
            dom.gatewayStatus.innerHTML = '<i class="fas fa-signal"></i> SMS API connected';
            return;
        }

        dom.gatewayStatus.className = "gateway-status not-configured";
        dom.gatewayStatus.innerHTML = '<i class="fas fa-triangle-exclamation"></i> SMS API configure করা নেই';
    }

    function renderRecentMessages() {
        if (!state.recentMessages.length) {
            dom.recentContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>কোনো এসএমএস পাঠানো হয়নি</p>
                </div>
            `;
            return;
        }

        dom.recentContainer.innerHTML = state.recentMessages.map(function (message) {
            const title = message.customerName
                ? `${window.escapeHtml(message.customerName)} • ${window.escapeHtml(message.phone)}`
                : window.escapeHtml(message.phone);

            return `
                <div class="recent-item">
                    <div class="recent-info">
                        <div class="recent-phone"><i class="fas fa-phone-alt"></i> ${title}</div>
                        <div class="recent-message">${window.escapeHtml(message.preview || message.message || "")}</div>
                        <div class="recent-time"><i class="far fa-clock"></i> ${window.formatBanglaDate(message.createdAt)}</div>
                    </div>
                    <div class="recent-status ${window.escapeHtml(message.status || "success")}">
                        <i class="fas fa-check-circle"></i> প্রেরিত
                    </div>
                </div>
            `;
        }).join("");
    }

    function showModal(type, title, text) {
        dom.modalIcon.className = "modal-icon";

        if (type === "success") {
            dom.modalIcon.classList.add("success");
            dom.modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (type === "error") {
            dom.modalIcon.classList.add("error");
            dom.modalIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        } else {
            dom.modalIcon.classList.add("warning");
            dom.modalIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        }

        dom.modalTitle.textContent = title;
        dom.modalText.textContent = text;
        dom.resultModal.style.display = "flex";
    }

    window.closeModal = function () {
        dom.resultModal.style.display = "none";
    };

    function updateCharacterCount() {
        const message = dom.smsMessage.value || "";
        const length = message.length;
        const smsCount = Math.max(1, Math.ceil(length / 160) || 1);

        dom.charCounter.textContent = `${length} / 160 অক্ষর`;
        dom.smsCount.textContent = String(smsCount);

        dom.charCounter.classList.remove("warning", "danger");

        if (length > 160) {
            dom.charCounter.classList.add("danger");
        } else if (length > 130) {
            dom.charCounter.classList.add("warning");
        }
    }

    window.updateCharacterCount = updateCharacterCount;

    window.loadCustomerPhone = function () {
        const selectedOption = dom.customerSelect.options[dom.customerSelect.selectedIndex];
        const phone = selectedOption ? selectedOption.getAttribute("data-phone") : "";

        if (phone) {
            dom.phoneNumber.value = phone;
        }

        if (dom.templateSelect.value) {
            window.loadTemplate();
        }
    };

    window.loadTemplate = function () {
        const templateKey = dom.templateSelect.value;
        const template = state.templates[templateKey];

        if (!template) {
            return;
        }

        const selectedOption = dom.customerSelect.options[dom.customerSelect.selectedIndex];
        const values = getTemplateValues(selectedOption);
        const nextMessage = template
            .replaceAll("{name}", values.name)
            .replaceAll("{customer}", values.name)
            .replaceAll("{phone}", values.phone)
            .replaceAll("{amount}", values.amount)
            .replaceAll("{mullo}", values.amount)
            .replaceAll("{price}", values.amount)
            .replaceAll("{total}", values.amount)
            .replaceAll("{vori}", values.vori)
            .replaceAll("{weight}", values.weight)
            .replaceAll("{gram}", values.weight)
            .replaceAll("{item}", values.item)
            .replaceAll("{product}", values.item)
            .replaceAll("{brand}", values.brand)
            .replaceAll("{karat}", values.karat)
            .replaceAll("{type}", values.type)
            .replaceAll("{action}", values.action);

        dom.smsMessage.value = nextMessage;
        window.updateCharacterCount();
    };

    function getTemplateValues(selectedOption) {
        const amount = Number(selectedOption ? selectedOption.getAttribute("data-amount") : 0) || 0;
        const vori = Number(selectedOption ? selectedOption.getAttribute("data-vori") : 0) || 0;
        const weight = Number(selectedOption ? selectedOption.getAttribute("data-weight") : 0) || 0;
        const type = selectedOption ? selectedOption.getAttribute("data-type") || "" : "";

        return {
            name: selectedOption ? selectedOption.getAttribute("data-name") || "গ্রাহক" : "গ্রাহক",
            phone: selectedOption ? selectedOption.getAttribute("data-phone") || "" : "",
            amount: amount.toLocaleString("en-US", {
                minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
                maximumFractionDigits: 3
            }),
            vori: vori.toLocaleString("en-US", {
                minimumFractionDigits: Number.isInteger(vori) ? 0 : 3,
                maximumFractionDigits: 3
            }),
            weight: weight.toLocaleString("en-US", {
                minimumFractionDigits: Number.isInteger(weight) ? 0 : 3,
                maximumFractionDigits: 3
            }),
            item: selectedOption ? selectedOption.getAttribute("data-item") || "পণ্য" : "পণ্য",
            brand: selectedOption ? selectedOption.getAttribute("data-brand") || "" : "",
            karat: selectedOption ? selectedOption.getAttribute("data-karat") || "" : "",
            type: type === "purchase" ? "ক্রয়" : type === "sale" ? "বিক্রয়" : type,
            action: selectedOption ? selectedOption.getAttribute("data-action") || "" : ""
        };
    }

    window.sendSMS = async function () {
        const phone = dom.phoneNumber.value.trim();
        const message = dom.smsMessage.value.trim();
        const customerId = dom.customerSelect.value;
        const templateKey = dom.templateSelect.value;

        if (!phone) {
            showModal("warning", "সতর্কতা", "মোবাইল নম্বর দিন");
            return;
        }

        if (!message) {
            showModal("warning", "সতর্কতা", "এসএমএস বার্তা লিখুন");
            return;
        }

        dom.sendBtn.disabled = true;

        try {
            const response = await window.appApiFetch("/sms/send", {
                method: "POST",
                body: JSON.stringify({
                    customerId: customerId,
                    phone: phone,
                    message: message,
                    templateKey: templateKey
                })
            });

            state.balance = Number(response.balance) || 0;
            state.recentMessages = response.recentMessages || [];
            renderBalance();
            renderRecentMessages();

            dom.smsMessage.value = "";
            dom.templateSelect.value = "";
            dom.customerSelect.value = "";
            dom.phoneNumber.value = "";
            window.updateCharacterCount();

            showModal("success", "এসএমএস পাঠানো হয়েছে", response.message);
        } catch (error) {
            showModal("error", "এসএমএস যায়নি", error.message);
        } finally {
            dom.sendBtn.disabled = false;
        }
    };
});
