(function () {
    const KARAT_OPTIONS = ["24K", "22K", "21K", "20K", "19K", "18K", "17K", "16K", "15K", "14K"];
    const VORI_TO_GRAM = 11.664;
    const VORI_TO_ANA = 16;
    const ANA_TO_RATI = 6;
    const RATI_TO_POINT = 6;
    const VORI_TO_RATI = VORI_TO_ANA * ANA_TO_RATI;
    const VORI_TO_POINT = VORI_TO_RATI * RATI_TO_POINT;
    const pageMode = document.body.dataset.tradeType === "sale" ? "sale" : "purchase";
    const defaultRates = pageMode === "sale"
        ? { "24K": 0, "22K": 0, "21K": 0, "20K": 0, "19K": 0, "18K": 0, "17K": 0, "16K": 0, "15K": 0, "14K": 0 }
        : { "24K": 0, "22K": 0, "21K": 0, "20K": 0, "19K": 0, "18K": 0, "17K": 0, "16K": 0, "15K": 0, "14K": 0 };
    const labels = pageMode === "sale"
        ? {
            customerPlaceholder: "-- ক্রেতা নির্বাচন করুন --",
            customerMissing: "ক্রেতা নির্বাচন করুন",
            saveComplete: "বিক্রয় সম্পন্ন হয়েছে",
            saveButtonError: "বিক্রয় সংরক্ষণ করা যায়নি",
            itemAdded: "আইটেম যোগ করা হয়েছে",
            itemRemoved: "আইটেম ডিলিট করা হয়েছে",
            allCleared: "সব আইটেম ডিলিট করা হয়েছে",
            modalActor: "ক্রেতা"
        }
        : {
            customerPlaceholder: "-- গ্রাহক নির্বাচন করুন --",
            customerMissing: "গ্রাহক নির্বাচন করুন",
            saveComplete: "ক্রয় সম্পন্ন হয়েছে",
            saveButtonError: "ক্রয় সংরক্ষণ করা যায়নি",
            itemAdded: "আইটেম যোগ করা হয়েছে",
            itemRemoved: "আইটেম ডিলিট করা হয়েছে",
            allCleared: "সব আইটেম ডিলিট করা হয়েছে",
            modalActor: "গ্রাহক"
        };

    const state = {
        customers: [],
        items: [],
        rates: [],
        selectedKarat: "22K",
        currentRatePerVori: 0,
        lockedCustomerId: "",
        isSaving: false,
        lastSavedOrder: null
    };

    const dom = {};

    document.addEventListener("DOMContentLoaded", init);

    function cacheDom() {
        dom.rateGrid = document.getElementById("rateGrid");
        dom.customerSelect = document.getElementById("customerSelect");
        dom.itemNameSelect = document.getElementById("itemNameSelect");
        dom.itemName = document.getElementById("itemName");
        dom.karatSelect = document.getElementById("karatSelect");
        dom.voriInput = document.getElementById("voriInput");
        dom.anaInput = document.getElementById("anaInput");
        dom.ratiInput = document.getElementById("ratiInput");
        dom.pointInput = document.getElementById("pointInput");
        dom.gramDisplay = document.getElementById("gramDisplay");
        dom.perVoriDisplay = document.getElementById("perVoriDisplay");
        dom.perAnaDisplay = document.getElementById("perAnaDisplay");
        dom.perRatiDisplay = document.getElementById("perRatiDisplay");
        dom.perPointDisplay = document.getElementById("perPointDisplay");
        dom.voriRateInput = document.getElementById("voriRateInput");
        dom.itemTotalDisplay = document.getElementById("itemTotalDisplay");
        dom.itemTotal = document.getElementById("itemTotal");
        dom.totalVoriHidden = document.getElementById("totalVoriHidden");
        dom.itemsContainer = document.getElementById("itemsContainer");
        dom.totalItems = document.getElementById("totalItems");
        dom.totalWeight = document.getElementById("totalWeight");
        dom.grandTotal = document.getElementById("grandTotal");
        dom.successModal = document.getElementById("successModal");
        dom.modalDetails = document.getElementById("modalDetails");
        dom.saveButton = document.querySelector(".btn-save");
    }

    async function init() {
        cacheDom();
        bindEvents();
        renderItems();
        calculateTotalPriceFromWeight();

        try {
            const [customers, settings] = await Promise.all([
                window.appApiFetch("/customers"),
                window.appApiFetch("/settings")
            ]);

            state.customers = customers;
            populateCustomerOptions();
            initializeRates(settings.tradeRates && settings.tradeRates[pageMode]);
        } catch (error) {
            populateCustomerOptions();
            initializeRates();
            showToast("error", error.message);
        }
    }

    function bindEvents() {
        if (dom.karatSelect) {
            dom.karatSelect.addEventListener("change", function () {
                selectKarat(dom.karatSelect.value);
            });
        }
    }

    function initializeRates(rateMap) {
        const safeRates = {};

        KARAT_OPTIONS.forEach(function (karat) {
            safeRates[karat] = Number(rateMap && rateMap[karat]) || Number(defaultRates[karat]) || 0;
        });

        state.rates = KARAT_OPTIONS.map(function (karat) {
            return {
                karat: karat,
                rate: safeRates[karat]
            };
        });

        state.selectedKarat = dom.karatSelect ? dom.karatSelect.value || "22K" : state.selectedKarat || "22K";
        renderEditableRateGrid();
        selectKarat(state.selectedKarat);
    }

    function populateCustomerOptions() {
        const options = [labels.customerPlaceholder].concat(
            state.customers.map(function (customer) {
                return `${customer.name} (${customer.phone})`;
            })
        );

        let html = `<option value="">${labels.customerPlaceholder}</option>`;
        state.customers.forEach(function (customer) {
            html += `<option value="${customer.id}">${window.escapeHtml(customer.name)} (${window.escapeHtml(customer.phone)})</option>`;
        });

        dom.customerSelect.innerHTML = html;
        dom.customerSelect.setAttribute("data-option-count", String(options.length));
        updateCustomerLock();
    }

    function refreshCustomerSelect2() {
        if (!dom.customerSelect || !window.jQuery || !window.jQuery.fn || !window.jQuery.fn.select2) {
            return;
        }

        const $customerSelect = window.jQuery(dom.customerSelect);

        if (!$customerSelect.hasClass("select2-hidden-accessible")) {
            $customerSelect.select2({
                width: "100%",
                placeholder: labels.customerPlaceholder,
                allowClear: true,
                dropdownParent: $customerSelect.closest(".form-card")
            });
        }

        $customerSelect
            .prop("disabled", Boolean(state.lockedCustomerId))
            .trigger("change.select2");
    }

    function getSelectedRateValue(karat) {
        const matchedRate = state.rates.find(function (rate) {
            return rate.karat === karat;
        });

        return matchedRate ? matchedRate.rate : 0;
    }

    function getRatesPayload() {
        const payload = {};

        state.rates.forEach(function (rate) {
            payload[rate.karat] = Number(rate.rate) || 0;
        });

        return payload;
    }

    function renderEditableRateGrid() {
        dom.rateGrid.innerHTML = state.rates.map(function (rate) {
            const isActive = rate.karat === state.selectedKarat;

            return `
                <div class="rate-item ${isActive ? "active" : ""}" onclick="selectKarat('${rate.karat}')">
                    <div class="rate-karat">${rate.karat}</div>
                    <div class="rate-value">
                        <input
                            type="number"
                            id="rate_${rate.karat}"
                            value="${Number(rate.rate) || 0}"
                            step="10"
                            onchange="updateGoldRate('${rate.karat}', this.value)"
                            onclick="event.stopPropagation()"
                        >
                    </div>
                </div>
            `;
        }).join("");
    }

    function updateCustomerLock() {
        if (!dom.customerSelect) {
            return;
        }

        dom.customerSelect.disabled = Boolean(state.lockedCustomerId);
        if (state.lockedCustomerId) {
            dom.customerSelect.value = state.lockedCustomerId;
        }
        refreshCustomerSelect2();
    }

    function getTotalVoriFromInputs() {
        const vori = Number(dom.voriInput.value) || 0;
        const ana = Number(dom.anaInput.value) || 0;
        const rati = Number(dom.ratiInput.value) || 0;
        const point = Number(dom.pointInput.value) || 0;

        return vori + (ana / VORI_TO_ANA) + (rati / VORI_TO_RATI) + (point / VORI_TO_POINT);
    }

    function convertVoriToComponents(totalVori) {
        const safeVori = Math.max(0, Number(totalVori) || 0);
        let voriPart = Math.floor(safeVori);
        const remainingVori = safeVori - voriPart;
        let totalPoint = remainingVori * VORI_TO_POINT;

        let ratiPart = Math.floor(totalPoint / RATI_TO_POINT);
        let pointPart = totalPoint - (ratiPart * RATI_TO_POINT);
        let anaPart = Math.floor(ratiPart / ANA_TO_RATI);
        let remainingRati = ratiPart - (anaPart * ANA_TO_RATI);

        pointPart = Math.round(pointPart * 100) / 100;

        if (pointPart >= RATI_TO_POINT) {
            pointPart = 0;
            remainingRati += 1;
        }

        if (remainingRati >= ANA_TO_RATI) {
            remainingRati = 0;
            anaPart += 1;
        }

        if (anaPart >= VORI_TO_ANA) {
            anaPart = 0;
            voriPart += 1;
        }

        return {
            vori: voriPart,
            ana: anaPart,
            rati: remainingRati,
            point: pointPart
        };
    }

    function updateWeightInputsFromVori(totalVori) {
        const components = convertVoriToComponents(totalVori);
        dom.voriInput.value = components.vori;
        dom.anaInput.value = components.ana;
        dom.ratiInput.value = components.rati;
        dom.pointInput.value = components.point;
    }

    function updateAllRateDisplays() {
        const perVori = Number(state.currentRatePerVori) || 0;
        const perAna = perVori / VORI_TO_ANA;
        const perRati = perAna / ANA_TO_RATI;
        const perPoint = perRati / RATI_TO_POINT;

        dom.perVoriDisplay.textContent = window.formatMoney(perVori);
        dom.perAnaDisplay.textContent = window.formatMoney(perAna);
        dom.perRatiDisplay.textContent = window.formatMoney(perRati);
        dom.perPointDisplay.textContent = window.formatMoney(perPoint);
    }

    function calculateTotalPriceFromWeight() {
        const totalVori = getTotalVoriFromInputs();
        const gram = totalVori * VORI_TO_GRAM;
        const totalPrice = totalVori * state.currentRatePerVori;

        dom.gramDisplay.innerHTML = `<i class="fas fa-chart-line"></i> = ${gram.toFixed(3)} গ্রাম (${totalVori.toFixed(4)} ভরি)`;
        dom.itemTotalDisplay.textContent = Number(totalPrice || 0).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        });
        dom.itemTotal.value = String(totalPrice);
        dom.totalVoriHidden.value = String(totalVori);

        return {
            gram: gram,
            vori: totalVori,
            total: totalPrice
        };
    }

    function formatWeightDisplay(item) {
        const parts = [];

        if (item.voriPart > 0) {
            parts.push(`${item.voriPart} ভরি`);
        }

        if (item.anaPart > 0) {
            parts.push(`${item.anaPart} আনা`);
        }

        if (item.ratiPart > 0) {
            parts.push(`${item.ratiPart} রতি`);
        }

        if (item.pointPart > 0) {
            parts.push(`${item.pointPart} পয়েন্ট`);
        }

        return parts.length ? parts.join(" ") : "0 ভরি";
    }

    function inferBrand(itemName) {
        const normalized = String(itemName || "").toLowerCase();

        if (normalized.includes("dubai")) {
            return "Dubai";
        }

        if (normalized.includes("bangla")) {
            return "Bangla";
        }

        if (normalized.includes("ic")) {
            return "IC";
        }

        return "General";
    }

    function renderItems() {
        if (!state.items.length) {
            dom.itemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>কোনো আইটেম যোগ করা হয়নি</p>
                </div>
            `;
            updateSummary();
            updateCustomerLock();
            return;
        }

        dom.itemsContainer.innerHTML = state.items.map(function (item) {
            return `
                <div class="item-card">
                    <div class="item-info">
                        <div class="item-name">${window.escapeHtml(item.name)}</div>
                        <div class="item-details">${window.escapeHtml(formatWeightDisplay(item))} | ${window.escapeHtml(item.brand)}</div>
                    </div>
                    <div class="item-price">
                        <div class="item-amount">${window.formatMoney(item.total)}</div>
                        <div class="item-weight">${item.gramAmount.toFixed(2)} গ্রাম</div>
                    </div>
                    <div class="delete-item" onclick="deleteItem('${item.id}')"><i class="fas fa-trash-alt"></i></div>
                </div>
            `;
        }).join("");

        updateSummary();
        updateCustomerLock();
    }

    function updateSummary() {
        const totalItems = state.items.length;
        const totalVori = state.items.reduce(function (sum, item) {
            return sum + item.voriAmount;
        }, 0);
        const totalGram = state.items.reduce(function (sum, item) {
            return sum + item.gramAmount;
        }, 0);
        const grandTotal = state.items.reduce(function (sum, item) {
            return sum + item.total;
        }, 0);

        dom.totalItems.textContent = String(totalItems);
        dom.totalWeight.textContent = `${totalGram.toFixed(3)} গ্রাম (${totalVori.toFixed(3)} ভরি)`;
        dom.grandTotal.textContent = window.formatMoney(grandTotal);
    }

    function clearForm() {
        dom.itemName.value = "";
        dom.itemNameSelect.value = "";
        dom.voriInput.value = "0";
        dom.anaInput.value = "0";
        dom.ratiInput.value = "0";
        dom.pointInput.value = "0";
        dom.itemTotalDisplay.textContent = "0";
        dom.itemTotal.value = "0";
        dom.totalVoriHidden.value = "0";
        calculateTotalPriceFromWeight();
    }

    function showToast(type, message) {
        const toast = document.createElement("div");
        const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `<i class="fas ${icon}"></i> ${window.escapeHtml(message)}`;
        document.body.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = "0";
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2200);
    }

    function openSuccessModal(order) {
        const customerName = order.customerName || "";
        const totals = order.totals || {};

        dom.modalDetails.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>${labels.modalActor}:</span>
                <span><strong>${window.escapeHtml(customerName)}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>মোট আইটেম:</span>
                <span><strong>${totals.itemCount || 0} টি</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>মোট ওজন:</span>
                <span><strong>${Number(totals.totalWeight || 0).toFixed(3)} গ্রাম</strong><br><small>(${Number(totals.totalVori || 0).toFixed(3)} ভরি)</small></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                <span style="font-weight: 600;">মোট মূল্য:</span>
                <span style="font-weight: 700;">${window.formatMoney(totals.grandTotal || 0)}</span>
            </div>
        `;

        dom.successModal.style.display = "flex";
    }

    async function saveCurrentTrade() {
        if (!state.items.length) {
            showToast("error", "কোনো আইটেম যোগ করা হয়নি");
            return;
        }

        const customerId = state.lockedCustomerId || dom.customerSelect.value;

        if (!customerId) {
            showToast("error", labels.customerMissing);
            return;
        }

        if (state.isSaving) {
            return;
        }

        state.isSaving = true;
        if (dom.saveButton) {
            dom.saveButton.disabled = true;
        }

        try {
            const response = await window.appApiFetch("/transactions", {
                method: "POST",
                body: JSON.stringify({
                    type: pageMode,
                    customerId: customerId,
                    items: state.items,
                    rates: getRatesPayload()
                })
            });

            state.lastSavedOrder = response.order;
            openSuccessModal(response.order);
        } catch (error) {
            showToast("error", error.message || labels.saveButtonError);
        } finally {
            state.isSaving = false;
            if (dom.saveButton) {
                dom.saveButton.disabled = false;
            }
        }
    }

    window.selectItemName = function () {
        const selectedValue = dom.itemNameSelect.value;

        if (selectedValue) {
            dom.itemName.value = selectedValue;
            dom.itemName.focus();
            dom.itemName.setSelectionRange(dom.itemName.value.length, dom.itemName.value.length);
        }
    };

    function clearItemNameSelect() {
        return;
    }

    window.clearItemNameSelect = clearItemNameSelect;

    window.selectKarat = function (karat) {
        state.selectedKarat = KARAT_OPTIONS.includes(karat) ? karat : "22K";
        state.currentRatePerVori = getSelectedRateValue(state.selectedKarat);
        if (dom.karatSelect) {
            dom.karatSelect.value = state.selectedKarat;
        }
        dom.voriRateInput.value = String(Math.round(state.currentRatePerVori));
        renderEditableRateGrid();
        updateAllRateDisplays();
        calculateTotalPriceFromWeight();
    };

    window.updateGoldRate = function (karat, newRate) {
        const numericRate = Number(newRate) || 0;

        state.rates = state.rates.map(function (rate) {
            if (rate.karat === karat) {
                return {
                    karat: rate.karat,
                    rate: numericRate
                };
            }

            return rate;
        });

        if (karat === state.selectedKarat) {
            state.currentRatePerVori = numericRate;
            dom.voriRateInput.value = String(Math.round(numericRate));
            updateAllRateDisplays();
            calculateTotalPriceFromWeight();
        }
    };

    window.updateRateFromInput = function () {
        const numericRate = Number(dom.voriRateInput.value) || 0;

        state.currentRatePerVori = numericRate;
        state.rates = state.rates.map(function (rate) {
            if (rate.karat === state.selectedKarat) {
                return {
                    karat: rate.karat,
                    rate: numericRate
                };
            }

            return rate;
        });

        renderEditableRateGrid();
        updateAllRateDisplays();
        calculateTotalPriceFromWeight();
    };

    function syncWeightFromInputs() {
        const totalVori = getTotalVoriFromInputs();
        updateWeightInputsFromVori(totalVori);
        calculateTotalPriceFromWeight();
    }

    window.syncWeightFromVori = syncWeightFromInputs;
    window.syncWeightFromAna = syncWeightFromInputs;
    window.syncWeightFromRati = syncWeightFromInputs;
    window.syncWeightFromPoint = syncWeightFromInputs;

    window.addItem = function () {
        const customerId = dom.customerSelect.value;
        const itemName = dom.itemName.value.trim();
        const karat = state.selectedKarat || "22K";
        const totalPrice = Number(dom.itemTotal.value) || 0;
        const totalVori = Number(dom.totalVoriHidden.value) || 0;
        const gramAmount = totalVori * VORI_TO_GRAM;

        if (!customerId) {
            showToast("error", labels.customerMissing);
            return;
        }

        if (state.lockedCustomerId && state.lockedCustomerId !== customerId) {
            showToast("error", "একসাথে এক জন গ্রাহকের আইটেমই যোগ করা যাবে");
            return;
        }

        if (!itemName) {
            showToast("error", "আইটেমের নাম লিখুন");
            return;
        }

        if (totalVori <= 0 || gramAmount <= 0) {
            showToast("error", "সঠিক ওজন দিন");
            return;
        }

        if (totalPrice <= 0) {
            showToast("error", "মূল্য গণনা করতে পারেনি");
            return;
        }

        state.lockedCustomerId = customerId;
        state.items.push({
            id: `local-${Date.now()}-${state.items.length + 1}`,
            name: itemName,
            brand: inferBrand(itemName),
            karat: karat,
            voriPart: Number(dom.voriInput.value) || 0,
            anaPart: Number(dom.anaInput.value) || 0,
            ratiPart: Number(dom.ratiInput.value) || 0,
            pointPart: Number(dom.pointInput.value) || 0,
            voriAmount: totalVori,
            gramAmount: gramAmount,
            ratePerVori: state.currentRatePerVori,
            total: totalPrice
        });

        renderItems();
        clearForm();
        showToast("success", labels.itemAdded);
    };

    window.deleteItem = function (itemId) {
        const shouldDelete = window.confirm("আইটেমটি ডিলিট করতে চান?");

        if (!shouldDelete) {
            return;
        }

        state.items = state.items.filter(function (item) {
            return item.id !== itemId;
        });

        if (!state.items.length) {
            state.lockedCustomerId = "";
        }

        renderItems();
        showToast("success", labels.itemRemoved);
    };

    window.clearAll = function () {
        if (!state.items.length) {
            return;
        }

        const shouldClear = window.confirm("সব আইটেম ডিলিট করতে চান?");

        if (!shouldClear) {
            return;
        }

        state.items = [];
        state.lockedCustomerId = "";
        renderItems();
        clearForm();
        showToast("success", labels.allCleared);
    };

    window.savePurchase = saveCurrentTrade;
    window.saveSale = saveCurrentTrade;

    window.closeModal = function () {
        dom.successModal.style.display = "none";

        if (!state.lastSavedOrder) {
            return;
        }

        state.items = [];
        state.lockedCustomerId = "";
        state.lastSavedOrder = null;
        renderItems();
        clearForm();
        if (dom.customerSelect) {
            dom.customerSelect.value = "";
            updateCustomerLock();
        }
        showToast("success", labels.saveComplete);
    };
})();
