(function () {
    const isFileProtocol = window.location.protocol === "file:";
    const backendAppOrigin = "https://goldmaster-backend.vercel.app";
    const sameOriginApiBase = `${window.location.origin}/api`;
    const remoteApiBase = `${backendAppOrigin}/api`;
    const isLocalhostHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const shouldUseSameOriginApi = window.location.origin === backendAppOrigin || (isLocalhostHost && window.location.port === "5000");
    const APP_NAV_CONFIG = {
        "index.html": { icon: "fa-house", shortLabel: "হোম" },
        "customer-index.html": { icon: "fa-users", shortLabel: "গ্রাহক" },
        "customer-create.html": { icon: "fa-user-plus", shortLabel: "নতুন" },
        "buysell-index.html": { icon: "fa-cart-shopping", shortLabel: "ক্রয়" },
        "buysell-sell.html": { icon: "fa-hand-holding-dollar", shortLabel: "বিক্রয়" },
        "sms-index.html": { icon: "fa-sms", shortLabel: "SMS" },
        "report-index.html": { icon: "fa-chart-column", shortLabel: "রিপোর্ট" },
        "privacy.html": { icon: "fa-shield-halved", shortLabel: "নীতি" },
        "admin-profile.html": { icon: "fa-user-gear", shortLabel: "প্রোফাইল" }
    };

    if (isFileProtocol) {
        window.APP_API_BASE_URL = remoteApiBase;
    } else {
        window.APP_API_BASE_URL = shouldUseSameOriginApi ? sameOriginApiBase : remoteApiBase;
    }

    window.appApiFetch = async function (path, options) {
        const requestOptions = Object.assign({}, options);
        const skipAuthRedirect = Boolean(requestOptions.skipAuthRedirect);
        delete requestOptions.skipAuthRedirect;
        requestOptions.headers = Object.assign({}, options && options.headers);
        requestOptions.credentials = requestOptions.credentials || (window.APP_API_BASE_URL === sameOriginApiBase ? "same-origin" : "include");

        if (requestOptions.body && !requestOptions.headers["Content-Type"]) {
            requestOptions.headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${window.APP_API_BASE_URL}${path}`, requestOptions);
        const rawText = await response.text();
        let payload = null;

        if (rawText) {
            try {
                payload = JSON.parse(rawText);
            } catch (error) {
                payload = rawText;
            }
        }

        if (response.status === 401 && !skipAuthRedirect && window.location.pathname !== "/login.html") {
            const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
            window.location.href = `login.html?next=${next}`;
        }

        if (!response.ok) {
            const message = payload && payload.message ? payload.message : "Server request failed.";
            throw new Error(message);
        }

        return payload;
    };

    window.escapeHtml = function (value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    };

    window.formatBanglaDate = function (value) {
        if (!value) {
            return "তথ্য নেই";
        }

        return new Date(value).toLocaleDateString("bn-BD", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    };

    window.formatMoney = function (value) {
        const numericValue = Number(value || 0);

        return `৳ ${numericValue.toLocaleString("en-US", {
            minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
            maximumFractionDigits: 3
        })}`;
    };

    function normalizePathname(pathname) {
        if (!pathname || pathname === "/") {
            return "/index.html";
        }

        return pathname;
    }

    function getPageFilename(pathname) {
        return normalizePathname(pathname).split("/").pop() || "index.html";
    }

    function getPageMeta(href, labelText) {
        const fileName = href.split("/").pop() || "index.html";
        const navConfig = APP_NAV_CONFIG[fileName] || {};

        return {
            href,
            fileName,
            icon: navConfig.icon || "fa-gem",
            label: navConfig.shortLabel || labelText || "Page"
        };
    }

    function createAppChrome(previewLinks) {
        if (!previewLinks || document.body.querySelector("[data-app-topbar]")) {
            return;
        }

        const currentPath = normalizePathname(window.location.pathname);
        const hasExistingBottomNav = Boolean(document.querySelector(".bottom-nav"));

        if (currentPath === "/index.html" || hasExistingBottomNav) {
            return;
        }

        const navEntries = Array.from(previewLinks.querySelectorAll("a.preview-link[href]")).filter(function (link) {
            const href = link.getAttribute("href");
            return href && href !== "#";
        }).map(function (link) {
            return {
                href: link.getAttribute("href"),
                label: link.textContent.trim(),
                isActive: link.classList.contains("active")
            };
        });

        if (!navEntries.some(function (entry) { return entry.href === "admin-profile.html"; })) {
            navEntries.push({
                href: "admin-profile.html",
                label: "প্রোফাইল",
                isActive: false
            });
        }

        if (!navEntries.length) {
            return;
        }

        const activeEntry =
            navEntries.find(function (entry) {
                return normalizePathname(new URL(entry.href, window.location.origin).pathname) === currentPath;
            }) ||
            navEntries.find(function (entry) {
                return entry.isActive;
            }) ||
            navEntries[0];

        const activeHref = activeEntry.href;
        const activeLabel = activeEntry.label;
        const activeMeta = getPageMeta(activeHref, activeLabel);
        const fallbackBackHref = currentPath === "/index.html" ? "/login.html" : "/index.html";

        const topbar = document.createElement("div");
        topbar.className = "app-page-topbar";
        topbar.setAttribute("data-app-topbar", "true");
        topbar.innerHTML = `
            <div class="app-page-topbar-inner">
                <button type="button" class="app-back-button" data-app-back>
                    <span class="app-back-button-icon"><i class="fas fa-arrow-left"></i></span>
                    <span class="app-back-button-copy">
                        <span>Navigate</span>
                        <strong>Back</strong>
                    </span>
                </button>
                <div class="app-page-current">
                    <span class="app-page-current-icon"><i class="fas ${activeMeta.icon}"></i></span>
                    <span class="app-page-current-copy">
                        <span>Current Page</span>
                        <strong>${window.escapeHtml(activeLabel || activeMeta.label)}</strong>
                    </span>
                </div>
            </div>
        `;

        const backButton = topbar.querySelector("[data-app-back]");
        if (backButton) {
            backButton.addEventListener("click", function () {
                const hasReferrer = Boolean(document.referrer);
                const sameOriginReferrer = hasReferrer && document.referrer.startsWith(window.location.origin);
                const referrerPath = sameOriginReferrer ? normalizePathname(new URL(document.referrer).pathname) : "";

                if (sameOriginReferrer && referrerPath !== currentPath) {
                    window.history.back();
                    return;
                }

                window.location.href = fallbackBackHref;
            });
        }

        const bottomNavShell = document.createElement("nav");
        bottomNavShell.className = "app-bottom-nav-shell";
        bottomNavShell.setAttribute("data-app-bottom-nav", "true");
        bottomNavShell.setAttribute("aria-label", "App navigation");

        const bottomNav = document.createElement("div");
        bottomNav.className = "app-bottom-nav";

        navEntries.forEach(function (entry) {
            const href = entry.href;
            const label = entry.label;
            const meta = getPageMeta(href, label);
            const navLink = document.createElement("a");
            const linkPath = normalizePathname(new URL(href, window.location.origin).pathname);

            navLink.className = "app-bottom-link";
            if (linkPath === currentPath) {
                navLink.classList.add("active");
            }

            navLink.href = href;
            navLink.innerHTML = `<i class="fas ${meta.icon}"></i><span>${window.escapeHtml(meta.label)}</span>`;
            bottomNav.appendChild(navLink);
        });

        bottomNavShell.appendChild(bottomNav);
        document.body.classList.add("has-app-chrome");

        const previewBar = document.querySelector(".preview-bar");
        if (previewBar && previewBar.parentNode) {
            previewBar.insertAdjacentElement("afterend", topbar);
        } else {
            document.body.insertAdjacentElement("afterbegin", topbar);
        }

        document.body.appendChild(bottomNavShell);
    }

    async function appendAuthControls(previewLinks) {
        if (!previewLinks || previewLinks.querySelector("[data-auth-controls]")) {
            return;
        }

        try {
            const authState = await window.appApiFetch("/auth/me", { skipAuthRedirect: true });
            const currentUser = authState && authState.user ? authState.user : null;
            const authWrapper = document.createElement("div");
            authWrapper.setAttribute("data-auth-controls", "true");
            authWrapper.style.display = "inline-flex";
            authWrapper.style.alignItems = "center";
            authWrapper.style.gap = "8px";

            const userBadge = document.createElement("span");
            userBadge.className = "preview-link";
            userBadge.style.cursor = "default";
            userBadge.textContent = currentUser ? currentUser.displayName : "User";

            const logoutLink = document.createElement("a");
            logoutLink.href = "#";
            logoutLink.className = "preview-link";
            logoutLink.textContent = "Logout";
            logoutLink.addEventListener("click", async function (event) {
                event.preventDefault();

                try {
                    await window.appApiFetch("/auth/logout", {
                        method: "POST",
                        skipAuthRedirect: true
                    });
                } catch (error) {
                    // Ignore logout API errors and continue redirecting to login.
                }

                window.location.href = "/login.html";
            });

            authWrapper.appendChild(userBadge);
            authWrapper.appendChild(logoutLink);
            previewLinks.appendChild(authWrapper);
        } catch (error) {
            // Protected pages will redirect on the next authenticated API call if the session is gone.
        }
    }

    document.addEventListener("DOMContentLoaded", async function () {
        if (window.location.pathname === "/login.html") {
            return;
        }

        const previewLinks = document.querySelector(".preview-links");
        if (!previewLinks) {
            return;
        }

        createAppChrome(previewLinks);
        await appendAuthControls(previewLinks);
    });
})();
