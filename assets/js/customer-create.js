document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("customerCreateForm");
    const feedback = document.getElementById("formFeedback");
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;

    if (!form || !feedback || !submitButton) {
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        const defaultButtonHtml = submitButton.innerHTML;

        feedback.className = "form-feedback";
        feedback.textContent = "";
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>সেভ হচ্ছে...';

        try {
            const savedCustomer = await window.appApiFetch("/customers", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            sessionStorage.setItem("lastCreatedCustomer", savedCustomer.name);
            feedback.className = "form-feedback success";
            feedback.textContent = `${savedCustomer.name} সফলভাবে সংরক্ষণ হয়েছে।`;
            form.reset();

            setTimeout(function () {
                window.location.href = "customer-index.html";
            }, 900);
        } catch (error) {
            feedback.className = "form-feedback error";
            feedback.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = defaultButtonHtml;
        }
    });
});
