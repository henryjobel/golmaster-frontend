document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("customerGrid");
    const searchInput = document.getElementById("searchCustomer");
    const stateText = document.getElementById("customerListState");
    const totalCustomersEl = document.getElementById("summaryTotalCustomers");
    const activeCustomersEl = document.getElementById("summaryActiveCustomers");
    const premiumCustomersEl = document.getElementById("summaryPremiumCustomers");
    const newCustomersEl = document.getElementById("summaryNewCustomers");

    const detailsModalEl = document.getElementById("customerDetailsModal");
    const editModalEl = document.getElementById("customerEditModal");
    const detailAvatarEl = document.getElementById("detailAvatar");
    const detailNameEl = document.getElementById("detailName");
    const detailPhoneEl = document.getElementById("detailPhone");
    const detailStatusEl = document.getElementById("detailStatus");
    const detailStatusTextEl = document.getElementById("detailStatusText");
    const detailAddressEl = document.getElementById("detailAddress");
    const detailTransactionCountEl = document.getElementById("detailTransactionCount");
    const detailTotalWeightEl = document.getElementById("detailTotalWeight");
    const detailLastDateEl = document.getElementById("detailLastDate");
    const detailLastWeightEl = document.getElementById("detailLastWeight");
    const detailLastActionEl = document.getElementById("detailLastAction");
    const detailJoinedAtEl = document.getElementById("detailJoinedAt");
    const detailTotalPurchaseEl = document.getElementById("detailTotalPurchase");
    const detailTotalSaleEl = document.getElementById("detailTotalSale");
    const detailSmsLinkEl = document.getElementById("detailSmsLink");
    const detailEditButton = document.getElementById("detailEditBtn");

    const editForm = document.getElementById("customerEditForm");
    const editCustomerIdEl = document.getElementById("editCustomerId");
    const editNameEl = document.getElementById("editName");
    const editPhoneEl = document.getElementById("editPhone");
    const editAddressEl = document.getElementById("editAddress");
    const editStatusEl = document.getElementById("editStatus");
    const editPreviewAvatarEl = document.getElementById("editPreviewAvatar");
    const editPreviewNameEl = document.getElementById("editPreviewName");
    const editPreviewPhoneEl = document.getElementById("editPreviewPhone");
    const editPreviewStatusEl = document.getElementById("editPreviewStatus");
    const editSideAvatarEl = document.getElementById("editSideAvatar");
    const editSideNameEl = document.getElementById("editSideName");
    const editSidePhoneEl = document.getElementById("editSidePhone");
    const editSideAddressEl = document.getElementById("editSideAddress");
    const editSaveButton = document.getElementById("editSaveButton");

    if (!grid || !searchInput || !stateText) {
        return;
    }

    const detailsModal = detailsModalEl && window.bootstrap ? new window.bootstrap.Modal(detailsModalEl) : null;
    const editModal = editModalEl && window.bootstrap ? new window.bootstrap.Modal(editModalEl) : null;

    let allCustomers = [];
    let activeDetailCustomerId = "";
    let isSaving = false;

    function getStatusClass(status) {
        if (status === "প্রিমিয়াম") {
            return "status-premium";
        }

        if (status === "নতুন") {
            return "status-new";
        }

        return "status-active";
    }

    function getInitials(name) {
        const parts = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2);

        if (!parts.length) {
            return "G";
        }

        return parts
            .map(function (part) {
                return part.charAt(0);
            })
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }

    function formatWeight(value) {
        const numericValue = Number(value || 0);

        if (numericValue <= 0) {
            return "তথ্য নেই";
        }

        return `${numericValue.toFixed(numericValue >= 10 ? 1 : 2)} গ্রাম`;
    }

    function formatCount(value) {
        return String(Number(value || 0));
    }

    function getLastActivityDate(customer) {
        return customer.lastActivityAt || customer.lastPurchaseDate || customer.createdAt;
    }

    function getLastActionText(customer) {
        return customer.lastAction || "নতুন গ্রাহক যোগ হয়েছে";
    }

    function setState(message, isError) {
        stateText.textContent = message;
        stateText.classList.toggle("is-error", Boolean(isError));
    }

    function updateSummary(customers) {
        const activeCustomers = customers.filter(function (customer) {
            return customer.status === "সক্রিয়";
        }).length;

        const premiumCustomers = customers.filter(function (customer) {
            return customer.status === "প্রিমিয়াম";
        }).length;

        const newCustomers = customers.filter(function (customer) {
            return customer.status === "নতুন";
        }).length;

        totalCustomersEl.textContent = customers.length;
        activeCustomersEl.textContent = activeCustomers;
        premiumCustomersEl.textContent = premiumCustomers;
        newCustomersEl.textContent = newCustomers;
    }

    function renderEmptyCard(message) {
        grid.innerHTML = `
            <div class="customer-card">
                <div class="customer-card-header">
                    <div class="customer-avatar">
                        <i class="fas fa-user-slash"></i>
                    </div>
                    <div class="customer-info">
                        <h3>কোনো গ্রাহক পাওয়া যায়নি</h3>
                        <div class="customer-phone">${window.escapeHtml(message)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCustomers(customers) {
        if (!customers.length) {
            renderEmptyCard("সার্চ বা ডাটাবেসে কোনো matching তথ্য নেই।");
            return;
        }

        grid.innerHTML = customers.map(function (customer) {
            const lastDate = customer.lastPurchaseDate || customer.createdAt;
            const purchaseValue = Number(customer.totalPurchaseGrams || 0).toFixed(1);
            const weightText = customer.lastTransactionWeight > 0 ? `${customer.lastTransactionWeight} গ্রাম` : "নতুন";

            return `
                <div class="customer-card">
                    <div class="customer-card-header">
                        <div class="customer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="customer-info">
                            <h3>${window.escapeHtml(customer.name)}</h3>
                            <div class="customer-phone">
                                <i class="fas fa-phone-alt"></i>
                                ${window.escapeHtml(customer.phone)}
                            </div>
                            <span class="customer-status ${getStatusClass(customer.status)}">${window.escapeHtml(customer.status)}</span>
                        </div>
                    </div>

                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-label">মোট লেনদেন</div>
                            <div class="stat-value">${purchaseValue} <small>গ্রাম</small></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">সর্বশেষ</div>
                            <div class="stat-value">${window.formatBanglaDate(lastDate)}</div>
                        </div>
                    </div>

                    <div class="customer-stats">
                        <div class="stat-item">
                            <div class="stat-label">সর্বশেষ অ্যাকশন</div>
                            <div class="stat-value"><small>${window.escapeHtml(customer.lastAction || "নতুন গ্রাহক যোগ হয়েছে")}</small></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">ওজন</div>
                            <div class="stat-value"><small>${window.escapeHtml(weightText)}</small></div>
                        </div>
                    </div>

                    <div class="customer-actions">
                        <button type="button" class="action-btn" title="বিস্তারিত" data-preview-action="details" data-customer-id="${customer.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="action-btn" title="এডিট" data-preview-action="edit" data-customer-id="${customer.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <a href="sms-index.html" class="action-btn" title="SMS পাঠান">
                            <i class="fas fa-sms"></i>
                        </a>
                        <button type="button" class="action-btn delete" title="ডিলিট" data-action="delete" data-customer-id="${customer.id}" data-customer-name="${window.escapeHtml(customer.name)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    function filterCustomers(searchTerm) {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            if (!allCustomers.length) {
                renderEmptyCard("এখনও কোনো গ্রাহক যোগ করা হয়নি।");
                setState("এখনও কোনো গ্রাহক নেই।", false);
                return;
            }

            renderCustomers(allCustomers);
            setState(`মোট ${allCustomers.length} জন গ্রাহক দেখানো হচ্ছে।`, false);
            return;
        }

        const filteredCustomers = allCustomers.filter(function (customer) {
            return [customer.name, customer.phone, customer.address, customer.status]
                .filter(Boolean)
                .some(function (value) {
                    return value.toLowerCase().includes(normalizedSearch);
                });
        });

        renderCustomers(filteredCustomers);

        if (filteredCustomers.length) {
            setState(`সার্চে ${filteredCustomers.length} জন গ্রাহক পাওয়া গেছে।`, false);
            return;
        }

        setState("সার্চে কোনো গ্রাহক পাওয়া যায়নি।", true);
    }

    function populateDetailsModal(customer) {
        activeDetailCustomerId = customer.id;
        detailAvatarEl.textContent = getInitials(customer.name);
        detailNameEl.textContent = customer.name || "গ্রাহকের নাম";
        detailPhoneEl.textContent = customer.phone || "ফোন নম্বর";
        detailAddressEl.textContent = customer.address || "ঠিকানা যোগ করা হয়নি";
        detailTransactionCountEl.textContent = formatCount(customer.transactionCount);
        detailTotalWeightEl.textContent = formatWeight(customer.totalPurchaseGrams);
        detailLastDateEl.textContent = window.formatBanglaDate(getLastActivityDate(customer));
        detailLastWeightEl.textContent = Number(customer.lastTransactionWeight || 0) > 0
            ? formatWeight(customer.lastTransactionWeight)
            : "তথ্য নেই";
        detailLastActionEl.textContent = getLastActionText(customer);
        detailJoinedAtEl.textContent = window.formatBanglaDate(customer.createdAt);
        detailTotalPurchaseEl.textContent = window.formatMoney(customer.totalPurchaseAmount || 0);
        detailTotalSaleEl.textContent = window.formatMoney(customer.totalSellAmount || 0);
        detailStatusEl.textContent = customer.status || "সক্রিয়";
        detailStatusEl.className = `customer-status ${getStatusClass(customer.status)}`;
        detailStatusTextEl.textContent = customer.status || "সক্রিয়";
        detailSmsLinkEl.href = `sms-index.html?customerId=${encodeURIComponent(customer.id)}`;
    }

    function syncEditPreview() {
        const safeName = editNameEl.value.trim() || "গ্রাহকের নাম";
        const safePhone = editPhoneEl.value.trim() || "ফোন নম্বর";
        const safeStatus = editStatusEl.value || "সক্রিয়";
        const safeAddress = editAddressEl.value.trim() || "ঠিকানা যোগ করা হয়নি";
        const initials = getInitials(safeName);

        editPreviewAvatarEl.textContent = initials;
        editPreviewNameEl.textContent = safeName;
        editPreviewPhoneEl.textContent = safePhone;
        editPreviewStatusEl.textContent = safeStatus;
        editPreviewStatusEl.className = `customer-status ${getStatusClass(safeStatus)}`;

        editSideAvatarEl.textContent = initials;
        editSideNameEl.textContent = safeName;
        editSidePhoneEl.textContent = safePhone;
        editSideAddressEl.textContent = safeAddress;
    }

    function populateEditForm(customer) {
        editCustomerIdEl.value = customer.id;
        editNameEl.value = customer.name || "";
        editPhoneEl.value = customer.phone || "";
        editAddressEl.value = customer.address || "";
        editStatusEl.value = customer.status || "সক্রিয়";
        syncEditPreview();
    }

    function openDetails(customer) {
        populateDetailsModal(customer);

        if (detailsModal) {
            detailsModal.show();
            return;
        }

        alert(
            `নাম: ${customer.name}\n` +
            `ফোন: ${customer.phone}\n` +
            `ঠিকানা: ${customer.address || "তথ্য নেই"}\n` +
            `স্ট্যাটাস: ${customer.status}\n` +
            `মোট লেনদেন: ${formatCount(customer.transactionCount)}\n` +
            `মোট সোনা: ${formatWeight(customer.totalPurchaseGrams)}`
        );
    }

    function openEdit(customer) {
        populateEditForm(customer);

        if (editModal) {
            editModal.show();
            return;
        }

        const nextName = window.prompt("নতুন নাম দিন:", customer.name);
        if (nextName === null) {
            return;
        }

        editNameEl.value = nextName;
        editPhoneEl.value = customer.phone;
        editAddressEl.value = customer.address || "";
        editStatusEl.value = customer.status || "সক্রিয়";
    }

    async function loadCustomers() {
        setState("গ্রাহক লোড হচ্ছে...", false);

        try {
            allCustomers = await window.appApiFetch("/customers");
            updateSummary(allCustomers);
            filterCustomers(searchInput.value);

            const lastCreatedCustomer = sessionStorage.getItem("lastCreatedCustomer");
            if (lastCreatedCustomer) {
                setState(`${lastCreatedCustomer} সফলভাবে যোগ হয়েছে।`, false);
                sessionStorage.removeItem("lastCreatedCustomer");
            }
        } catch (error) {
            allCustomers = [];
            grid.innerHTML = "";
            updateSummary(allCustomers);
            setState(error.message, true);
            renderEmptyCard("Backend চালু আছে কি না চেক করো।");
        }
    }

    searchInput.addEventListener("input", function () {
        filterCustomers(searchInput.value);
    });

    [editNameEl, editPhoneEl, editAddressEl].forEach(function (element) {
        if (!element) {
            return;
        }

        element.addEventListener("input", syncEditPreview);
    });

    if (editStatusEl) {
        editStatusEl.addEventListener("change", syncEditPreview);
    }

    if (detailEditButton) {
        detailEditButton.addEventListener("click", function () {
            const customer = allCustomers.find(function (entry) {
                return entry.id === activeDetailCustomerId;
            });

            if (!customer) {
                setState("গ্রাহকের তথ্য আর পাওয়া যাচ্ছে না।", true);
                return;
            }

            if (detailsModal) {
                detailsModal.hide();
            }

            window.setTimeout(function () {
                openEdit(customer);
            }, detailsModal ? 180 : 0);
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (isSaving) {
                return;
            }

            const customerId = editCustomerIdEl.value;
            const payload = {
                name: editNameEl.value.trim(),
                phone: editPhoneEl.value.trim(),
                address: editAddressEl.value.trim(),
                status: editStatusEl.value
            };

            if (!payload.name || !payload.phone) {
                setState("নাম এবং মোবাইল নম্বর অবশ্যই দিতে হবে।", true);
                return;
            }

            isSaving = true;
            editSaveButton.disabled = true;
            editSaveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সেভ হচ্ছে...';

            try {
                const updatedCustomer = await window.appApiFetch(`/customers/${customerId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });

                allCustomers = allCustomers.map(function (entry) {
                    return entry.id === updatedCustomer.id ? updatedCustomer : entry;
                });

                updateSummary(allCustomers);
                filterCustomers(searchInput.value);
                populateDetailsModal(updatedCustomer);
                setState(`${updatedCustomer.name} এর তথ্য আপডেট হয়েছে।`, false);

                if (editModal) {
                    editModal.hide();
                }
            } catch (error) {
                setState(error.message, true);
            } finally {
                isSaving = false;
                editSaveButton.disabled = false;
                editSaveButton.innerHTML = '<i class="fas fa-floppy-disk"></i> সেভ করুন';
            }
        });
    }

    grid.addEventListener("click", async function (event) {
        const actionButton = event.target.closest("[data-preview-action]");
        const deleteButton = event.target.closest('[data-action="delete"]');

        if (actionButton) {
            const customerId = actionButton.getAttribute("data-customer-id");
            const action = actionButton.getAttribute("data-preview-action");
            const customer = allCustomers.find(function (entry) {
                return entry.id === customerId;
            });

            if (!customer) {
                setState("গ্রাহকের তথ্য আর পাওয়া যাচ্ছে না।", true);
                return;
            }

            if (action === "details") {
                openDetails(customer);
                return;
            }

            if (action === "edit") {
                openEdit(customer);
            }

            return;
        }

        if (!deleteButton) {
            return;
        }

        const customerId = deleteButton.getAttribute("data-customer-id");
        const customerName = deleteButton.getAttribute("data-customer-name");
        const shouldDelete = window.confirm(`${customerName} কে ডিলিট করতে চাও?`);

        if (!shouldDelete) {
            return;
        }

        try {
            await window.appApiFetch(`/customers/${customerId}`, {
                method: "DELETE"
            });

            allCustomers = allCustomers.filter(function (customer) {
                return customer.id !== customerId;
            });

            updateSummary(allCustomers);
            filterCustomers(searchInput.value);
            setState(`${customerName} ডিলিট করা হয়েছে।`, false);
        } catch (error) {
            setState(error.message, true);
        }
    });

    loadCustomers();
});
