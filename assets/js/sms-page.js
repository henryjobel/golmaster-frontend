document.addEventListener("DOMContentLoaded", function () {
    const state = {
        balance: 0,
        templates: {},
        recentMessages: [],
        customers: []
    };

    const dom = {
        balanceAmount: document.querySelector(".balance-amount"),
        smsAmount: document.getElementById("smsAmount"),
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

        try {
            const overview = await window.appApiFetch("/sms/overview");
            state.balance = Number(overview.balance) || 0;
            state.templates = overview.templates || {};
            state.recentMessages = overview.recentMessages || [];
            state.customers = overview.customers || [];
            renderBalance();
            populateCustomers();
            renderRecentMessages();
        } catch (error) {
            renderBalance();
            renderRecentMessages();
            showModal("error", "সংযোগ হয়নি", error.message);
        }
    }

    function populateCustomers() {
        let html = '<option value="">-- গ্রাহক নির্বাচন করুন --</option>';

        state.customers.forEach(function (customer) {
            html += `<option value="${customer.id}" data-phone="${window.escapeHtml(customer.phone)}" data-name="${window.escapeHtml(customer.name)}">${window.escapeHtml(customer.name)} (${window.escapeHtml(customer.phone)})</option>`;
        });

        dom.customerSelect.innerHTML = html;
    }

    function renderBalance() {
        dom.balanceAmount.innerHTML = `${Number(state.balance || 0).toLocaleString("en-US")} <span class="balance-unit">SMS</span>`;
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

    window.updateCharacterCount = function () {
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
    };

    window.setSMSAmount = function (amount) {
        dom.smsAmount.value = String(amount);
    };

    window.loadCustomerPhone = function () {
        const selectedOption = dom.customerSelect.options[dom.customerSelect.selectedIndex];
        const phone = selectedOption ? selectedOption.getAttribute("data-phone") : "";

        if (phone) {
            dom.phoneNumber.value = phone;
        }
    };

    window.loadTemplate = function () {
        const templateKey = dom.templateSelect.value;
        const template = state.templates[templateKey];

        if (!template) {
            return;
        }

        const selectedOption = dom.customerSelect.options[dom.customerSelect.selectedIndex];
        const customerName = selectedOption ? selectedOption.getAttribute("data-name") || "গ্রাহক" : "গ্রাহক";
        const nextMessage = template
            .replaceAll("{name}", customerName)
            .replaceAll("{amount}", "XXXX");

        dom.smsMessage.value = nextMessage;
        window.updateCharacterCount();
    };

    window.topUpSMS = async function () {
        const amount = Number(dom.smsAmount.value);

        if (!Number.isFinite(amount) || amount <= 0) {
            showModal("warning", "সতর্কতা", "সঠিক এসএমএস সংখ্যা দিন");
            return;
        }

        try {
            const response = await window.appApiFetch("/sms/topup", {
                method: "POST",
                body: JSON.stringify({ amount: amount })
            });

            state.balance = Number(response.balance) || 0;
            renderBalance();
            showModal("success", "প্যাকেজ ক্রয় সম্পন্ন", response.message);
        } catch (error) {
            showModal("error", "ক্রয় হয়নি", error.message);
        }
    };

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
