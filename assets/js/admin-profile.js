document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("adminProfileForm");
    const displayNameInput = document.getElementById("profileDisplayName");
    const usernameEl = document.getElementById("profileUsername");
    const roleEl = document.getElementById("profileRole");
    const createdAtEl = document.getElementById("profileCreatedAt");
    const updatedAtEl = document.getElementById("profileUpdatedAt");
    const messageEl = document.getElementById("profileMessage");
    const saveButton = document.getElementById("profileSaveButton");
    const previewAvatarEl = document.getElementById("profilePreviewAvatar");
    const previewNameEl = document.getElementById("profilePreviewName");
    const previewUsernameEl = document.getElementById("profilePreviewUsername");
    const previewRoleEl = document.getElementById("profilePreviewRole");
    const passwordForm = document.getElementById("adminPasswordForm");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordMessageEl = document.getElementById("passwordMessage");
    const passwordSaveButton = document.getElementById("passwordSaveButton");

    if (!form || !displayNameInput) {
        return;
    }

    let profileUser = null;
    let isSaving = false;
    let isPasswordSaving = false;

    function getInitials(name) {
        const parts = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2);

        if (!parts.length) {
            return "A";
        }

        return parts.map(function (part) {
            return part.charAt(0);
        }).join("").slice(0, 2).toUpperCase();
    }

    function setMessage(message, type) {
        messageEl.className = "profile-message";

        if (!message) {
            messageEl.textContent = "";
            return;
        }

        messageEl.textContent = message;
        messageEl.classList.add(type === "error" ? "error" : "success");
    }

    function setPasswordMessage(message, type) {
        passwordMessageEl.className = "password-message";

        if (!message) {
            passwordMessageEl.textContent = "";
            return;
        }

        passwordMessageEl.textContent = message;
        passwordMessageEl.classList.add(type === "error" ? "error" : "success");
    }

    function syncPreview() {
        const displayName = displayNameInput.value.trim() || "Admin";
        previewAvatarEl.textContent = getInitials(displayName);
        previewNameEl.textContent = displayName;
        previewUsernameEl.textContent = profileUser ? profileUser.username : "admin";
        previewRoleEl.textContent = profileUser ? profileUser.role : "admin";
    }

    function populateUser(user) {
        profileUser = user;
        displayNameInput.value = user.displayName || "";
        usernameEl.textContent = user.username || "admin";
        roleEl.textContent = user.role || "admin";
        createdAtEl.textContent = window.formatBanglaDate(user.createdAt);
        updatedAtEl.textContent = user.updatedAt ? window.formatBanglaDate(user.updatedAt) : "এখনও update হয়নি";
        syncPreview();
    }

    async function loadProfile() {
        setMessage("", "success");

        try {
            const payload = await window.appApiFetch("/auth/profile");
            populateUser(payload.user);
        } catch (error) {
            setMessage(error.message, "error");
        }
    }

    displayNameInput.addEventListener("input", function () {
        setMessage("", "success");
        syncPreview();
    });

    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(function (element) {
        if (!element) {
            return;
        }

        element.addEventListener("input", function () {
            setPasswordMessage("", "success");
        });
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        const nextDisplayName = displayNameInput.value.trim();
        if (!nextDisplayName) {
            setMessage("নাম অবশ্যই দিতে হবে।", "error");
            return;
        }

        isSaving = true;
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সেভ হচ্ছে...';

        try {
            const payload = await window.appApiFetch("/auth/profile", {
                method: "PUT",
                body: JSON.stringify({
                    displayName: nextDisplayName
                })
            });

            populateUser(payload.user);
            setMessage(payload.message || "নাম সফলভাবে আপডেট হয়েছে।", "success");

            const currentUserBadge = document.querySelector("[data-auth-controls] span.preview-link");
            if (currentUserBadge) {
                currentUserBadge.textContent = payload.user.displayName || payload.user.username;
            }
        } catch (error) {
            setMessage(error.message, "error");
        } finally {
            isSaving = false;
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-floppy-disk"></i> নাম সেভ করুন';
        }
    });

    if (passwordForm) {
        passwordForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (isPasswordSaving) {
                return;
            }

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!currentPassword) {
                setPasswordMessage("বর্তমান পাসওয়ার্ড দিন।", "error");
                return;
            }

            if (!newPassword) {
                setPasswordMessage("নতুন পাসওয়ার্ড দিন।", "error");
                return;
            }

            if (newPassword.length < 8) {
                setPasswordMessage("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।", "error");
                return;
            }

            if (newPassword !== confirmPassword) {
                setPasswordMessage("নতুন পাসওয়ার্ড এবং confirm password একই হতে হবে।", "error");
                return;
            }

            isPasswordSaving = true;
            passwordSaveButton.disabled = true;
            passwordSaveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সেভ হচ্ছে...';

            try {
                const payload = await window.appApiFetch("/auth/password", {
                    method: "PUT",
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                });

                passwordForm.reset();
                setPasswordMessage(payload.message || "পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।", "success");
            } catch (error) {
                setPasswordMessage(error.message, "error");
            } finally {
                isPasswordSaving = false;
                passwordSaveButton.disabled = false;
                passwordSaveButton.innerHTML = '<i class="fas fa-key"></i> পাসওয়ার্ড সেভ করুন';
            }
        });
    }

    loadProfile();
});
