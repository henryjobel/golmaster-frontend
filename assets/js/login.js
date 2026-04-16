document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const nextPathInput = document.getElementById("nextPath");
    const submitButton = document.getElementById("loginSubmit");
    const feedback = document.getElementById("loginFeedback");
    const nextParam = new URLSearchParams(window.location.search).get("next");

    nextPathInput.value = nextParam && nextParam.startsWith("/") ? nextParam : "/";

    initialize();

    async function initialize() {
        try {
            const authState = await window.appApiFetch("/auth/me", { skipAuthRedirect: true });
            if (authState && authState.user) {
                window.location.href = nextPathInput.value || "/";
            }
        } catch (error) {
            usernameInput.focus();
        }
    }

    function setFeedback(message, type) {
        feedback.style.display = "block";
        feedback.textContent = message;
        feedback.style.background = type === "error" ? "#fdecea" : "#e8f5e9";
        feedback.style.color = type === "error" ? "#c62828" : "#2e7d32";
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const nextPath = nextPathInput.value || "/";
        const defaultButtonHtml = submitButton.innerHTML;

        feedback.style.display = "none";
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>লগইন হচ্ছে...';

        try {
            const result = await window.appApiFetch("/auth/login", {
                method: "POST",
                skipAuthRedirect: true,
                body: JSON.stringify({
                    username: username,
                    password: password,
                    next: nextPath
                })
            });

            setFeedback(result.message || "সফলভাবে লগইন হয়েছে।", "success");

            setTimeout(function () {
                window.location.href = result.redirectTo || "/";
            }, 500);
        } catch (error) {
            setFeedback(error.message, "error");
            passwordInput.focus();
            passwordInput.select();
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = defaultButtonHtml;
        }
    });
});
