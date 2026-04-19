document.addEventListener("DOMContentLoaded", function () {
    const TABLE_PAGE_SIZE = 8;

    const state = {
        currentTab: "customer",
        customers: [],
        customerReports: {},
        pagination: {
            customer: 1,
            product: 1,
            gold: 1,
            profit: 1,
            loss: 1
        },
        stockReport: {
            brandSummary: [],
            productSummary: [],
            karatSummary: [],
            recentPurchases: [],
            totalGoldWeight: 0,
            totalGoldVori: 0
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
        productStockPagination: document.getElementById("productStockPagination"),
        totalProductItems: document.getElementById("totalProductItems"),
        karatStockGrid: document.getElementById("karatStockGrid"),
        totalGoldWeight: document.getElementById("totalGoldWeight"),
        totalGoldVori: document.getElementById("totalGoldVori"),
        goldPurchaseBody: document.getElementById("goldPurchaseBody"),
        goldPurchasePagination: document.getElementById("goldPurchasePagination"),
        customerSection: document.getElementById("customerSection"),
        stockSection: document.getElementById("stockSection"),
        goldSection: document.getElementById("goldSection"),
        profitSection: document.getElementById("profitSection"),
        lossSection: document.getElementById("lossSection"),
        netProfitAmount: document.getElementById("netProfitAmount"),
        netProfitCustomerCount: document.getElementById("netProfitCustomerCount"),
        profitTotalSell: document.getElementById("profitTotalSell"),
        profitTotalPurchase: document.getElementById("profitTotalPurchase"),
        profitTransactionCount: document.getElementById("profitTransactionCount"),
        profitTableBody: document.getElementById("profitTableBody"),
        profitTablePagination: document.getElementById("profitTablePagination"),
        netLossAmount: document.getElementById("netLossAmount"),
        netLossCustomerCount: document.getElementById("netLossCustomerCount"),
        lossTotalPurchase: document.getElementById("lossTotalPurchase"),
        lossTotalSell: document.getElementById("lossTotalSell"),
        lossTransactionCount: document.getElementById("lossTransactionCount"),
        lossTableBody: document.getElementById("lossTableBody"),
        lossTablePagination: document.getElementById("lossTablePagination"),
        customerTablePagination: document.getElementById("customerTablePagination"),
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
            renderProfitLossReport("profit");
            renderProfitLossReport("loss");
        } catch (error) {
            dom.customerTableBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-circle-exclamation"></i><p>${window.escapeHtml(error.message)}</p></td></tr>`;
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

    function clearPagination(container) {
        if (container) {
            container.innerHTML = "";
            container.style.display = "none";
        }
    }

    function renderPagination(key, totalRows, container) {
        if (!container || totalRows <= TABLE_PAGE_SIZE) {
            clearPagination(container);
            return;
        }

        const totalPages = Math.ceil(totalRows / TABLE_PAGE_SIZE);
        const currentPage = Math.min(Math.max(1, state.pagination[key] || 1), totalPages);
        const startItem = (currentPage - 1) * TABLE_PAGE_SIZE + 1;
        const endItem = Math.min(currentPage * TABLE_PAGE_SIZE, totalRows);
        const pageButtons = [];
        const visiblePages = [];

        for (let page = 1; page <= totalPages; page += 1) {
            const isEdgePage = page === 1 || page === totalPages;
            const isNearCurrentPage = Math.abs(page - currentPage) <= 1;

            if (totalPages <= 5 || isEdgePage || isNearCurrentPage) {
                visiblePages.push(page);
            }
        }

        visiblePages.forEach(function (page, index) {
            if (index > 0 && page - visiblePages[index - 1] > 1) {
                pageButtons.push('<button class="pagination-btn" disabled>...</button>');
            }

            pageButtons.push(`
                <button class="pagination-btn ${page === currentPage ? "active" : ""}" onclick="changeReportPage('${key}', ${page})">${page}</button>
            `);
        });

        container.style.display = "flex";
        container.innerHTML = `
            <div class="pagination-info">${startItem}-${endItem} / ${totalRows}</div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="changeReportPage('${key}', ${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${pageButtons.join("")}
                <button class="pagination-btn" onclick="changeReportPage('${key}', ${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    function getPageRows(key, rows) {
        const totalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE));
        const currentPage = Math.min(Math.max(1, state.pagination[key] || 1), totalPages);

        state.pagination[key] = currentPage;

        const start = (currentPage - 1) * TABLE_PAGE_SIZE;
        return rows.slice(start, start + TABLE_PAGE_SIZE);
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
            clearPagination(dom.productStockPagination);
        } else {
            const pageRows = getPageRows("product", productSummary);

            dom.productStockBody.innerHTML = pageRows.map(function (product) {
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
            renderPagination("product", productSummary.length, dom.productStockPagination);
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

        const totalGoldVori = Number(state.stockReport.totalGoldVori) || karatSummary.reduce(function (sum, karat) {
            return sum + (Number(karat.vori) || 0);
        }, 0);

        dom.totalGoldWeight.textContent = Number(state.stockReport.totalGoldWeight || 0).toFixed(2);
        dom.totalGoldVori.textContent = totalGoldVori.toFixed(2);

        if (!recentPurchases.length) {
            dom.goldPurchaseBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-history"></i><p>কোনো ক্রয় ইতিহাস নেই</p></td></tr>';
            clearPagination(dom.goldPurchasePagination);
            return;
        }

        const pageRows = getPageRows("gold", recentPurchases);

        dom.goldPurchaseBody.innerHTML = pageRows.map(function (purchase) {
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
        renderPagination("gold", recentPurchases.length, dom.goldPurchasePagination);
    }

    function renderCustomerReport(customerId) {
        if (!customerId) {
            resetCustomerSummary();
            dom.customerTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-user"></i><p>গ্রাহক নির্বাচন করুন</p></td></tr>';
            clearPagination(dom.customerTablePagination);
            return;
        }

        const report = state.customerReports[customerId];

        if (!report) {
            resetCustomerSummary();
            dom.customerTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-history"></i><p>কোনো লেনদেন নেই</p></td></tr>';
            clearPagination(dom.customerTablePagination);
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
            dom.customerTableBody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-history"></i><p>কোনো লেনদেন নেই</p></td></tr>';
            clearPagination(dom.customerTablePagination);
            return;
        }

        const pageRows = getPageRows("customer", report.rows);

        dom.customerTableBody.innerHTML = pageRows.map(function (row) {
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
                    <td>
                        <strong>${isPurchase ? "ক্রয় ভরি" : "বিক্রয় ভরি"}</strong><br>
                        <small>${Number(row.vori || 0).toFixed(3)} ভরি</small>
                    </td>
                </tr>
            `;
        }).join("");
        renderPagination("customer", report.rows.length, dom.customerTablePagination);
    }

    function getCustomerName(customerId) {
        const customer = state.customers.find(function (entry) {
            return entry.id === customerId;
        });

        return customer ? `${customer.name} (${customer.phone})` : "গ্রাহক";
    }

    function getProfitLossRows(type) {
        return Object.values(state.customerReports)
            .map(function (report) {
                const netAmount = Number(report.netAmount) || 0;
                return {
                    customerId: report.customerId,
                    customerName: getCustomerName(report.customerId),
                    totalPurchase: Number(report.totalPurchase) || 0,
                    totalSell: Number(report.totalSell) || 0,
                    transactionCount: Number(report.transactionCount) || 0,
                    netAmount,
                    displayAmount: Math.abs(netAmount)
                };
            })
            .filter(function (row) {
                return type === "profit" ? row.netAmount > 0 : row.netAmount < 0;
            })
            .sort(function (left, right) {
                return right.displayAmount - left.displayAmount;
            });
    }

    function getProfitLossTotals(rows) {
        return rows.reduce(function (totals, row) {
            totals.amount += row.displayAmount;
            totals.totalPurchase += row.totalPurchase;
            totals.totalSell += row.totalSell;
            totals.transactionCount += row.transactionCount;
            return totals;
        }, {
            amount: 0,
            totalPurchase: 0,
            totalSell: 0,
            transactionCount: 0
        });
    }

    function renderProfitLossReport(type) {
        const isProfit = type === "profit";
        const rows = getProfitLossRows(type);
        const totals = getProfitLossTotals(rows);
        const tableBody = isProfit ? dom.profitTableBody : dom.lossTableBody;
        const pagination = isProfit ? dom.profitTablePagination : dom.lossTablePagination;

        if (isProfit) {
            dom.netProfitAmount.textContent = window.formatMoney(totals.amount);
            dom.netProfitAmount.style.color = "#2e7d32";
            dom.netProfitCustomerCount.textContent = `${rows.length} জন গ্রাহক`;
            dom.profitTotalSell.textContent = window.formatMoney(totals.totalSell);
            dom.profitTotalPurchase.textContent = window.formatMoney(totals.totalPurchase);
            dom.profitTransactionCount.textContent = String(totals.transactionCount);
        } else {
            dom.netLossAmount.textContent = window.formatMoney(totals.amount);
            dom.netLossAmount.style.color = "#c62828";
            dom.netLossCustomerCount.textContent = `${rows.length} জন গ্রাহক`;
            dom.lossTotalPurchase.textContent = window.formatMoney(totals.totalPurchase);
            dom.lossTotalSell.textContent = window.formatMoney(totals.totalSell);
            dom.lossTransactionCount.textContent = String(totals.transactionCount);
        }

        if (!rows.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas ${isProfit ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i>
                        <p>${isProfit ? "মোট আয় নেই" : "মোট ক্ষতি নেই"}</p>
                    </td>
                </tr>
            `;
            clearPagination(pagination);
            return;
        }

        const pageRows = getPageRows(type, rows);

        tableBody.innerHTML = pageRows.map(function (row) {
            return `
                <tr>
                    <td><strong>${window.escapeHtml(row.customerName)}</strong></td>
                    <td>${window.formatMoney(row.totalPurchase)}</td>
                    <td>${window.formatMoney(row.totalSell)}</td>
                    <td style="font-weight: 700; color: ${isProfit ? "#2e7d32" : "#c62828"};">${window.formatMoney(row.displayAmount)}</td>
                    <td>${row.transactionCount} টি</td>
                </tr>
            `;
        }).join("");
        renderPagination(type, rows.length, pagination);
    }

    window.loadCustomerReport = function () {
        state.pagination.customer = 1;
        renderCustomerReport(dom.customerSelect.value);
    };

    window.changeReportPage = function (key, page) {
        state.pagination[key] = page;

        if (key === "customer") {
            renderCustomerReport(dom.customerSelect.value);
            return;
        }

        if (key === "product") {
            renderStockReport();
            return;
        }

        if (key === "gold") {
            renderGoldReport();
            return;
        }

        if (key === "profit" || key === "loss") {
            renderProfitLossReport(key);
        }
    };

    window.switchTab = function (tabName) {
        state.currentTab = tabName;

        dom.tabButtons.forEach(function (button) {
            button.classList.toggle("active", button.getAttribute("data-report-tab") === tabName);
        });

        dom.customerSection.style.display = tabName === "customer" ? "block" : "none";
        dom.stockSection.style.display = tabName === "stock" ? "block" : "none";
        dom.goldSection.style.display = tabName === "gold" ? "block" : "none";
        dom.profitSection.style.display = tabName === "profit" ? "block" : "none";
        dom.lossSection.style.display = tabName === "loss" ? "block" : "none";
    };
});
