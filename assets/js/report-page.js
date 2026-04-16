document.addEventListener("DOMContentLoaded", function () {
    const state = {
        currentTab: "customer",
        customers: [],
        customerReports: {},
        stockReport: {
            brandSummary: [],
            productSummary: [],
            karatSummary: [],
            recentPurchases: [],
            totalGoldWeight: 0
        }
    };

    const dom = {
        customerSelect: document.getElementById("customerSelect"),
        customerTableBody: document.getElementById("customerTableBody"),
        custTotalPurchase: document.getElementById("custTotalPurchase"),
        custPurchaseCount: document.getElementById("custPurchaseCount"),
        custTotalSell: document.getElementById("custTotalSell"),
        custSellCount: document.getElementById("custSellCount"),
        custNetAmount: document.getElementById("custNetAmount"),
        custTransactionCount: document.getElementById("custTransactionCount"),
        custTotalGold: document.getElementById("custTotalGold"),
        custTotalVori: document.getElementById("custTotalVori"),
        brandStockList: document.getElementById("brandStockList"),
        totalBrandProducts: document.getElementById("totalBrandProducts"),
        productStockBody: document.getElementById("productStockBody"),
        totalProductItems: document.getElementById("totalProductItems"),
        karatStockGrid: document.getElementById("karatStockGrid"),
        totalGoldWeight: document.getElementById("totalGoldWeight"),
        goldPurchaseBody: document.getElementById("goldPurchaseBody"),
        customerSection: document.getElementById("customerSection"),
        stockSection: document.getElementById("stockSection"),
        goldSection: document.getElementById("goldSection"),
        tabButtons: Array.from(document.querySelectorAll(".tab-btn"))
    };

    init();

    async function init() {
        try {
            const overview = await window.appApiFetch("/reports/overview");
            state.customers = overview.customers || [];
            state.customerReports = overview.customerReports || {};
            state.stockReport = overview.stockReport || state.stockReport;
            populateCustomers();
            renderStockReport();
            renderGoldReport();
        } catch (error) {
            dom.customerTableBody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-circle-exclamation"></i><p>${window.escapeHtml(error.message)}</p></td></tr>`;
        }
    }

    function populateCustomers() {
        let html = '<option value="">-- গ্রাহক নির্বাচন করুন --</option>';

        state.customers.forEach(function (customer) {
            html += `<option value="${customer.id}">${window.escapeHtml(customer.name)} (${window.escapeHtml(customer.phone)})</option>`;
        });

        dom.customerSelect.innerHTML = html;
    }

    function resetCustomerSummary() {
        dom.custTotalPurchase.textContent = "৳ 0";
        dom.custPurchaseCount.textContent = "0 টি লেনদেন";
        dom.custTotalSell.textContent = "৳ 0";
        dom.custSellCount.textContent = "0 টি লেনদেন";
        dom.custNetAmount.textContent = "৳ 0";
        dom.custNetAmount.style.color = "#1a1a2e";
        dom.custTransactionCount.textContent = "0 বার লেনদেন";
        dom.custTotalGold.textContent = "0 গ্রাম";
        dom.custTotalVori.textContent = "0 ভরি";
    }

    function renderStockReport() {
        const brandSummary = state.stockReport.brandSummary || [];
        const productSummary = state.stockReport.productSummary || [];

        if (!brandSummary.length) {
            dom.brandStockList.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>কোনো স্টক ডাটা নেই</p></div>';
        } else {
            dom.brandStockList.innerHTML = brandSummary.map(function (brand) {
                return `
                    <div class="brand-item">
                        <div class="brand-name">
                            <div class="brand-icon"><i class="fas ${window.escapeHtml(brand.icon)}"></i></div>
                            <div>
                                <strong>${window.escapeHtml(brand.brand)}</strong>
                                <div style="font-size: 11px; color: #999;">${brand.itemCount} টি পণ্য</div>
                            </div>
                        </div>
                        <div class="brand-stats">
                            <div class="brand-weight">${Number(brand.totalWeight || 0).toFixed(2)} গ্রাম</div>
                            <div class="brand-count">(${Number(brand.totalVori || 0).toFixed(2)} ভরি) | ${window.formatMoney(brand.value || 0)}</div>
                        </div>
                    </div>
                `;
            }).join("");
        }

        dom.totalBrandProducts.textContent = String(
            brandSummary.reduce(function (sum, brand) {
                return sum + (Number(brand.itemCount) || 0);
            }, 0)
        );

        if (!productSummary.length) {
            dom.productStockBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-box-open"></i><p>কোনো স্টক পাওয়া যায়নি</p></td></tr>';
        } else {
            dom.productStockBody.innerHTML = productSummary.map(function (product) {
                return `
                    <tr>
                        <td><strong>${window.escapeHtml(product.name)}</strong></td>
                        <td>${window.escapeHtml(product.brand)}</td>
                        <td>${window.escapeHtml(product.karat)}</td>
                        <td>${product.quantity} টি</td>
                        <td>${Number(product.weight || 0).toFixed(2)} গ্রাম (${Number(product.vori || 0).toFixed(2)} ভরি)</td>
                    </tr>
                `;
            }).join("");
        }

        dom.totalProductItems.textContent = String(
            productSummary.reduce(function (sum, product) {
                return sum + (Number(product.quantity) || 0);
            }, 0)
        );
    }

    function renderGoldReport() {
        const karatSummary = state.stockReport.karatSummary || [];
        const recentPurchases = state.stockReport.recentPurchases || [];

        if (!karatSummary.length) {
            dom.karatStockGrid.innerHTML = '<div class="empty-state"><i class="fas fa-gem"></i><p>কারেট ভিত্তিক ডাটা নেই</p></div>';
        } else {
            dom.karatStockGrid.innerHTML = karatSummary.map(function (karat) {
                return `
                    <div class="karat-item">
                        <div class="karat-name">${window.escapeHtml(karat.karat)}</div>
                        <div class="karat-weight">${Number(karat.weight || 0).toFixed(2)} <small>গ্রাম</small></div>
                        <div class="karat-weight" style="font-size: 12px;">(${Number(karat.vori || 0).toFixed(2)} ভরি)</div>
                        <div style="font-size: 11px; color: #999;">${window.formatMoney(karat.value || 0)}</div>
                    </div>
                `;
            }).join("");
        }

        dom.totalGoldWeight.textContent = Number(state.stockReport.totalGoldWeight || 0).toFixed(2);

        if (!recentPurchases.length) {
            dom.goldPurchaseBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-history"></i><p>কোনো ক্রয় ইতিহাস নেই</p></td></tr>';
            return;
        }

        dom.goldPurchaseBody.innerHTML = recentPurchases.map(function (purchase) {
            return `
                <tr>
                    <td>${window.formatBanglaDate(purchase.date)}</td>
                    <td>${window.escapeHtml(purchase.supplier || "গ্রাহক")}</td>
                    <td>${window.escapeHtml(purchase.karat)}</td>
                    <td>${Number(purchase.weight || 0).toFixed(2)} গ্রাম (${Number(purchase.vori || 0).toFixed(2)} ভরি)</td>
                    <td>${window.formatMoney(purchase.amount || 0)}</td>
                </tr>
            `;
        }).join("");
    }

    function renderCustomerReport(customerId) {
        if (!customerId) {
            resetCustomerSummary();
            dom.customerTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-user"></i><p>গ্রাহক নির্বাচন করুন</p></td></tr>';
            return;
        }

        const report = state.customerReports[customerId];

        if (!report) {
            resetCustomerSummary();
            dom.customerTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-history"></i><p>কোনো লেনদেন নেই</p></td></tr>';
            return;
        }

        dom.custTotalPurchase.textContent = window.formatMoney(report.totalPurchase || 0);
        dom.custPurchaseCount.textContent = `${report.purchaseCount || 0} টি লেনদেন`;
        dom.custTotalSell.textContent = window.formatMoney(report.totalSell || 0);
        dom.custSellCount.textContent = `${report.sellCount || 0} টি লেনদেন`;
        dom.custNetAmount.textContent = window.formatMoney(report.netAmount || 0);
        dom.custNetAmount.style.color = Number(report.netAmount || 0) >= 0 ? "#2e7d32" : "#c62828";
        dom.custTransactionCount.textContent = `${report.transactionCount || 0} বার লেনদেন`;
        dom.custTotalGold.textContent = `${Number(report.totalGold || 0).toFixed(2)} গ্রাম`;
        dom.custTotalVori.textContent = `${Number(report.totalVori || 0).toFixed(2)} ভরি`;

        if (!report.rows || !report.rows.length) {
            dom.customerTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-history"></i><p>কোনো লেনদেন নেই</p></td></tr>';
            return;
        }

        dom.customerTableBody.innerHTML = report.rows.map(function (row) {
            const isPurchase = row.type === "purchase";
            return `
                <tr>
                    <td>${window.formatBanglaDate(row.date)}</td>
                    <td style="font-weight: 600; color: ${isPurchase ? "#1565c0" : "#2e7d32"};">
                        <i class="fas ${isPurchase ? "fa-arrow-down" : "fa-arrow-up"}"></i>
                        ${isPurchase ? "ক্রয়" : "বিক্রয়"}
                    </td>
                    <td>${window.escapeHtml(row.item)}</td>
                    <td>${window.escapeHtml(row.karat)}</td>
                    <td>${Number(row.weight || 0).toFixed(2)} গ্রাম<br><small>(${Number(row.vori || 0).toFixed(3)} ভরি)</small></td>
                    <td style="font-weight: 700;">${window.formatMoney(row.amount || 0)}</td>
                </tr>
            `;
        }).join("");
    }

    window.loadCustomerReport = function () {
        renderCustomerReport(dom.customerSelect.value);
    };

    window.switchTab = function (tabName) {
        state.currentTab = tabName;

        dom.tabButtons.forEach(function (button, index) {
            const isActive =
                (tabName === "customer" && index === 0) ||
                (tabName === "stock" && index === 1) ||
                (tabName === "gold" && index === 2);

            button.classList.toggle("active", isActive);
        });

        dom.customerSection.style.display = tabName === "customer" ? "block" : "none";
        dom.stockSection.style.display = tabName === "stock" ? "block" : "none";
        dom.goldSection.style.display = tabName === "gold" ? "block" : "none";
    };
});
