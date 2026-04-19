document.addEventListener("DOMContentLoaded", function () {
    const totalCustomersEl = document.getElementById("dashboardCustomerCount");
    const customerChangeEl = document.getElementById("dashboardCustomerChange");
    const todaySalesEl = document.getElementById("dashboardTodaySales");
    const todaySalesMetaEl = document.getElementById("dashboardTodaySalesMeta");
    const stockWeightEl = document.getElementById("dashboardStockWeight");
    const stockMetaEl = document.getElementById("dashboardStockMeta");
    const transactionCountEl = document.getElementById("dashboardTransactionCount");
    const transactionMetaEl = document.getElementById("dashboardTransactionMeta");
    const goldRateEl = document.getElementById("dashboardGoldRate");
    const recentCustomersEl = document.getElementById("dashboardRecentCustomers");
    const quickActionButtons = Array.from(document.querySelectorAll("[data-href], [data-api-link]"));

    if (!totalCustomersEl || !customerChangeEl || !recentCustomersEl) {
        return;
    }

    function renderRecentCustomers(customers) {
        if (!customers.length) {
            recentCustomersEl.innerHTML = `
                <div class="customer-item">
                    <div class="customer-info">
                        <div class="customer-avatar">
                            <i class="fas fa-user-slash"></i>
                        </div>
                        <div>
                            <div class="customer-details">কোনো সাম্প্রতিক গ্রাহক নেই</div>
                            <div class="customer-action">নতুন data যোগ হলে এখানে দেখাবে</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        recentCustomersEl.innerHTML = customers.map(function (customer) {
            const amount = customer.lastTransactionWeight > 0 ? `${customer.lastTransactionWeight} গ্রাম` : "নতুন";

            return `
                <div class="customer-item">
                    <div class="customer-info">
                        <div class="customer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div class="customer-details">${window.escapeHtml(customer.name)}</div>
                            <div class="customer-action">${window.escapeHtml(customer.lastAction || "নতুন গ্রাহক যোগ হয়েছে")}</div>
                        </div>
                    </div>
                    <div class="customer-transaction">
                        <div class="transaction-amount">${window.escapeHtml(amount)}</div>
                        <div class="transaction-time">${window.formatBanglaDate(customer.createdAt)}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    async function loadDashboard() {
        try {
            const dashboard = await window.appApiFetch("/dashboard");
            totalCustomersEl.textContent = dashboard.totalCustomers;
            customerChangeEl.textContent = `+${dashboard.newCustomers}`;
            if (todaySalesEl) {
                todaySalesEl.textContent = window.formatMoney(dashboard.todaySalesAmount || 0);
            }
            if (todaySalesMetaEl) {
                todaySalesMetaEl.textContent = `${dashboard.todaySalesOrders || 0} অর্ডার`;
            }
            if (stockWeightEl) {
                stockWeightEl.textContent = `${Number(dashboard.totalStockWeight || 0).toFixed(2)}g`;
            }
            if (stockMetaEl) {
                stockMetaEl.textContent = `${dashboard.totalStockItems || 0} আইটেম`;
            }
            if (transactionCountEl) {
                transactionCountEl.textContent = dashboard.totalTransactions || 0;
            }
            if (transactionMetaEl) {
                transactionMetaEl.textContent = "ক্রয় + বিক্রয়";
            }
            if (goldRateEl) {
                goldRateEl.textContent = window.formatMoney(dashboard.goldRate22K || 0);
            }
            renderRecentCustomers(dashboard.recentCustomers || []);
        } catch (error) {
            totalCustomersEl.textContent = "--";
            customerChangeEl.textContent = "API বন্ধ";
            if (todaySalesEl) {
                todaySalesEl.textContent = "--";
            }
            if (todaySalesMetaEl) {
                todaySalesMetaEl.textContent = "ডাটা নেই";
            }
            if (stockWeightEl) {
                stockWeightEl.textContent = "--";
            }
            if (stockMetaEl) {
                stockMetaEl.textContent = "ডাটা নেই";
            }
            if (transactionCountEl) {
                transactionCountEl.textContent = "--";
            }
            if (transactionMetaEl) {
                transactionMetaEl.textContent = "ডাটা নেই";
            }
            if (goldRateEl) {
                goldRateEl.textContent = "--";
            }
            recentCustomersEl.innerHTML = `
                <div class="customer-item">
                    <div class="customer-info">
                        <div class="customer-avatar">
                            <i class="fas fa-circle-exclamation"></i>
                        </div>
                        <div>
                            <div class="customer-details">Backend connection হয়নি</div>
                            <div class="customer-action">${window.escapeHtml(error.message)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    quickActionButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const apiLink = this.getAttribute("data-api-link");
            const href = this.getAttribute("data-href");

            if (apiLink) {
                window.open(`${window.APP_API_BASE_URL}${apiLink.replace(/^\/api/, "")}`, "_blank");
                return;
            }

            if (href) {
                window.location.href = href;
            }
        });
    });

    loadDashboard();
});
