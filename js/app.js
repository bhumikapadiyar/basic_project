/* ==========================================================================
   MAIN APPLICATION CONTROLLER (js/app.js)
   Orchestrates Auth vs Dashboard routing, UI events, theme & toast system
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. TOAST NOTIFICATION SYSTEM ---
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-circle';
        if (type === 'warning') iconName = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        // Auto Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };


    // --- 2. THEME CONTROLLER (DARK / LIGHT MODE) ---
    const themeBtn = document.getElementById('btn-theme-toggle');
    const savedTheme = localStorage.getItem('nexus_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('nexus_theme', next);
            showToast(`Switched to ${next} theme`, 'info');
        });
    }


    // --- 3. SESSION & VIEW SWITCHER (AUTH vs DASHBOARD) ---
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');

    const updateUserInfoUI = (user) => {
        if (!user) return;
        const nameElements = ['sidebar-user-name', 'header-user-name', 'menu-user-name', 'welcome-user-name', 'settings-name'];
        const emailElements = ['menu-user-email', 'settings-email'];
        const roleElements = ['sidebar-user-role', 'settings-role'];

        nameElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = user.name;
        });

        emailElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = user.email;
        });

        roleElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'INPUT') el.value = user.role || 'Administrator';
                else el.textContent = user.role || 'Administrator';
            }
        });

        if (user.avatar) {
            const avatars = ['sidebar-user-avatar', 'header-user-avatar', 'settings-avatar-preview'];
            avatars.forEach(id => {
                const img = document.getElementById(id);
                if (img) img.src = user.avatar;
            });
        }
    };

    const checkSessionAndRender = () => {
        const user = AuthModule.getCurrentUser();
        if (user) {
            // User is signed in -> Show Dashboard
            authScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            updateUserInfoUI(user);

            // Initialize Dashboard Data & Charts
            DashboardModule.renderTable();
            DashboardModule.renderTeam();
            DashboardModule.renderActivityLogs();
            DashboardModule.initRevenueChart('7d');
            DashboardModule.initTrafficChart();
            DashboardModule.startLiveClock();
        } else {
            // User is signed out -> Show Auth Screen
            authScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
        }
    };

    // Initialize Auth Database
    AuthModule.initDatabase();
    checkSessionAndRender();


    // --- 4. AUTH TABS SWITCHER (SIGN IN <-> SIGN UP) ---
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');

    const switchAuthTab = (target) => {
        if (target === 'signin') {
            tabSignin.classList.add('active');
            tabSignin.setAttribute('aria-selected', 'true');
            tabSignup.classList.remove('active');
            tabSignup.setAttribute('aria-selected', 'false');

            signinForm.classList.remove('hidden-form');
            signinForm.classList.add('active-form');
            signupForm.classList.add('hidden-form');
            signupForm.classList.remove('active-form');
        } else {
            tabSignup.classList.add('active');
            tabSignup.setAttribute('aria-selected', 'true');
            tabSignin.classList.remove('active');
            tabSignin.setAttribute('aria-selected', 'false');

            signupForm.classList.remove('hidden-form');
            signupForm.classList.add('active-form');
            signinForm.classList.add('hidden-form');
            signinForm.classList.remove('active-form');
        }
    };

    if (tabSignin) tabSignin.addEventListener('click', () => switchAuthTab('signin'));
    if (tabSignup) tabSignup.addEventListener('click', () => switchAuthTab('signup'));


    // Password Visibility Toggle
    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = btn.closest('.input-wrapper');
            const input = wrapper.querySelector('input');
            const icon = btn.querySelector('.eye-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                if (icon) icon.setAttribute('data-lucide', 'eye');
            }
            if (window.lucide) window.lucide.createIcons();
        });
    });


    // Password Strength Meter Listener
    const signupPwInput = document.getElementById('signup-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (signupPwInput) {
        signupPwInput.addEventListener('input', () => {
            const val = signupPwInput.value;
            const res = AuthModule.checkPasswordStrength(val);

            if (strengthFill) {
                strengthFill.className = `strength-fill ${res.class}`;
            }
            if (strengthText) {
                strengthText.textContent = res.text || 'Password strength';
            }
        });
    }


    // --- 5. SIGN IN & SIGN UP FORM SUBMISSIONS ---
    // 1-Click Demo Login Button
    const btnQuickDemo = document.getElementById('btn-quick-demo');
    if (btnQuickDemo) {
        btnQuickDemo.addEventListener('click', () => {
            const demoUser = AuthModule.DEMO_ACCOUNTS[0];
            const res = AuthModule.authenticate(demoUser.email, demoUser.password);
            if (res.success) {
                showToast(`Welcome back, ${res.user.name}! Demo mode activated.`, 'success');
                checkSessionAndRender();
            }
        });
    }

    // Sign In Submit
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('signin-email');
            const passwordInput = document.getElementById('signin-password');
            const emailError = document.getElementById('signin-email-error');
            const passwordError = document.getElementById('signin-password-error');

            // Reset errors
            emailError.textContent = '';
            passwordError.textContent = '';

            let hasError = false;

            if (!emailInput.value.trim()) {
                emailError.textContent = 'Please enter your email address.';
                hasError = true;
            } else if (!AuthModule.isValidEmail(emailInput.value)) {
                emailError.textContent = 'Please enter a valid email address.';
                hasError = true;
            }

            if (!passwordInput.value) {
                passwordError.textContent = 'Please enter your password.';
                hasError = true;
            }

            if (hasError) return;

            // Submit credentials
            const res = AuthModule.authenticate(emailInput.value, passwordInput.value);
            if (res.success) {
                showToast(`Signed in successfully as ${res.user.name}!`, 'success');
                checkSessionAndRender();
            } else {
                showToast(res.message, 'error');
                passwordError.textContent = res.message;
            }
        });
    }

    // Sign Up Submit
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('signup-name');
            const emailInput = document.getElementById('signup-email');
            const roleSelect = document.getElementById('signup-role');
            const passwordInput = document.getElementById('signup-password');
            const confirmInput = document.getElementById('signup-confirm-password');
            const termsCheck = document.getElementById('signup-terms');

            const nameError = document.getElementById('signup-name-error');
            const emailError = document.getElementById('signup-email-error');
            const passwordError = document.getElementById('signup-password-error');
            const confirmError = document.getElementById('signup-confirm-password-error');
            const termsError = document.getElementById('signup-terms-error');

            nameError.textContent = '';
            emailError.textContent = '';
            passwordError.textContent = '';
            confirmError.textContent = '';
            termsError.textContent = '';

            let hasError = false;

            if (!nameInput.value.trim()) {
                nameError.textContent = 'Please enter your full name.';
                hasError = true;
            }

            if (!emailInput.value.trim() || !AuthModule.isValidEmail(emailInput.value)) {
                emailError.textContent = 'Please enter a valid email address.';
                hasError = true;
            }

            if (passwordInput.value.length < 8) {
                passwordError.textContent = 'Password must be at least 8 characters long.';
                hasError = true;
            }

            if (passwordInput.value !== confirmInput.value) {
                confirmError.textContent = 'Passwords do not match.';
                hasError = true;
            }

            if (!termsCheck.checked) {
                termsError.textContent = 'You must agree to the Terms of Service.';
                hasError = true;
            }

            if (hasError) return;

            const res = AuthModule.register({
                name: nameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
                role: roleSelect.value
            });

            if (res.success) {
                showToast(`Account created! Welcome to Nexus, ${res.user.name}.`, 'success');
                checkSessionAndRender();
            } else {
                showToast(res.message, 'error');
                emailError.textContent = res.message;
            }
        });
    }

    // Social Auth Buttons simulation
    const btnGoogle = document.getElementById('btn-social-google');
    const btnGithub = document.getElementById('btn-social-github');
    
    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const demoUser = AuthModule.DEMO_ACCOUNTS[0];
            AuthModule.setSession(demoUser);
            showToast('Signed in via Google Workspace', 'success');
            checkSessionAndRender();
        });
    }

    if (btnGithub) {
        btnGithub.addEventListener('click', () => {
            const demoUser = AuthModule.DEMO_ACCOUNTS[1];
            AuthModule.setSession(demoUser);
            showToast('Signed in via GitHub OAuth', 'success');
            checkSessionAndRender();
        });
    }


    // Prevent default on placeholder anchor links
    document.querySelectorAll('a[href="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (a.id === 'link-forgot-pw') {
                showToast('Password reset link sent to registered email address.', 'info');
            }
        });
    });

    // --- 6. LOGOUT HANDLERS ---
    const handleSignout = () => {
        AuthModule.logout();
        showToast('You have been signed out.', 'info');
        checkSessionAndRender();
    };

    const btnQuickSignout = document.getElementById('btn-quick-signout');
    const btnSignoutMain = document.getElementById('btn-signout-main');
    if (btnQuickSignout) btnQuickSignout.addEventListener('click', handleSignout);
    if (btnSignoutMain) btnSignoutMain.addEventListener('click', handleSignout);


    // --- 7. DASHBOARD NAVIGATION & VIEW ROUTING ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item, .nav-trigger-link');
    const viewSections = document.querySelectorAll('.view-section');

    const switchView = (targetView) => {
        navItems.forEach(item => {
            if (item.getAttribute('data-view') === targetView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        viewSections.forEach(section => {
            if (section.id === `view-${targetView}`) {
                section.classList.remove('hidden');
                section.classList.add('active-view');
            } else {
                section.classList.add('hidden');
                section.classList.remove('active-view');
            }
        });

        // Initialize view specific components if needed
        if (targetView === 'analytics') {
            DashboardModule.initAnalyticsLoadChart();
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            if (view) {
                switchView(view);
                // Close mobile sidebar if open
                sidebar.classList.remove('mobile-open');
            }
        });
    });


    // --- 8. SIDEBAR COLLAPSE & MOBILE DRAWER ---
    const sidebar = document.getElementById('sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnCloseMobileSidebar = document.getElementById('btn-close-mobile-sidebar');

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    if (btnCloseMobileSidebar) {
        btnCloseMobileSidebar.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
        });
    }


    // --- 9. DROPDOWNS CONTROLLER (Notifications & Profile) ---
    const btnNotif = document.getElementById('btn-notifications');
    const menuNotif = document.getElementById('notifications-menu');
    const btnProfile = document.getElementById('btn-user-profile-menu');
    const menuProfile = document.getElementById('user-menu');

    const closeAllDropdowns = () => {
        if (menuNotif) menuNotif.classList.remove('show');
        if (menuProfile) menuProfile.classList.remove('show');
    };

    if (btnNotif) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            menuProfile.classList.remove('show');
            menuNotif.classList.toggle('show');
        });
    }

    if (btnProfile) {
        btnProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            menuNotif.classList.remove('show');
            menuProfile.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => closeAllDropdowns());

    // Mark notifications read
    const btnMarkRead = document.getElementById('btn-mark-notifications-read');
    if (btnMarkRead) {
        btnMarkRead.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.notification-item.unread').forEach(el => el.classList.remove('unread'));
            const badge = document.getElementById('notification-count');
            if (badge) badge.textContent = '0';
            showToast('All notifications marked as read', 'info');
        });
    }


    // --- 10. SEARCH & FILTER CONTROLLER ---
    const globalSearchInput = document.getElementById('global-search-input');
    const statusFilterSelect = document.getElementById('table-filter-status');

    const handleTableFilter = () => {
        const query = globalSearchInput ? globalSearchInput.value : '';
        const status = statusFilterSelect ? statusFilterSelect.value : 'all';
        DashboardModule.renderTable(status, query);
    };

    if (globalSearchInput) globalSearchInput.addEventListener('input', handleTableFilter);
    if (statusFilterSelect) statusFilterSelect.addEventListener('change', handleTableFilter);

    // Keyboard shortcut (Cmd + K / Ctrl + K)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (globalSearchInput) globalSearchInput.focus();
        }
    });


    // --- 11. CHART FILTER PERIOD BUTTONS ---
    document.querySelectorAll('.chart-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.getAttribute('data-period');
            DashboardModule.initRevenueChart(period);
        });
    });


    // --- 12. MODAL MANAGERS ---
    // Transaction Modal
    const modalTransaction = document.getElementById('modal-transaction');
    const btnOpenTxModal = document.getElementById('btn-open-new-transaction');
    const btnCloseTxModal = document.getElementById('btn-close-transaction-modal');
    const btnCancelTx = document.getElementById('btn-cancel-transaction');
    const formNewTx = document.getElementById('form-new-transaction');

    if (btnOpenTxModal) {
        btnOpenTxModal.addEventListener('click', () => {
            modalTransaction.classList.remove('hidden');
        });
    }

    const closeTxModal = () => modalTransaction.classList.add('hidden');
    if (btnCloseTxModal) btnCloseTxModal.addEventListener('click', closeTxModal);
    if (btnCancelTx) btnCancelTx.addEventListener('click', closeTxModal);

    if (formNewTx) {
        formNewTx.addEventListener('submit', (e) => {
            e.preventDefault();
            const customer = document.getElementById('tx-customer').value;
            const amount = document.getElementById('tx-amount').value;
            const category = document.getElementById('tx-category').value;
            const status = document.getElementById('tx-status').value;

            DashboardModule.addTransaction({ customer, amount, category, status });
            showToast(`Recorded payment of $${amount} from ${customer}`, 'success');
            formNewTx.reset();
            closeTxModal();
        });
    }

    // Team Modal
    const modalTeam = document.getElementById('modal-team');
    const btnOpenTeamModal = document.getElementById('btn-add-team-member');
    const btnCloseTeamModal = document.getElementById('btn-close-team-modal');
    const btnCancelTeam = document.getElementById('btn-cancel-team');
    const formNewTeam = document.getElementById('form-new-team');

    if (btnOpenTeamModal) {
        btnOpenTeamModal.addEventListener('click', () => {
            modalTeam.classList.remove('hidden');
        });
    }

    const closeTeamModal = () => modalTeam.classList.add('hidden');
    if (btnCloseTeamModal) btnCloseTeamModal.addEventListener('click', closeTeamModal);
    if (btnCancelTeam) btnCancelTeam.addEventListener('click', closeTeamModal);

    if (formNewTeam) {
        formNewTeam.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('member-name').value;
            const email = document.getElementById('member-email').value;
            const role = document.getElementById('member-role').value;

            DashboardModule.addTeamMember({ name, email, role });
            showToast(`Invitation sent to ${email}`, 'success');
            formNewTeam.reset();
            closeTeamModal();
        });
    }

    // Pagination Click Listeners
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');

    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            const page = DashboardModule.getPage();
            if (page > 1) DashboardModule.setPage(page - 1);
        });
    }

    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            const page = DashboardModule.getPage();
            DashboardModule.setPage(page + 1);
        });
    }

    // Event delegation for table delete row
    const tbody = document.getElementById('transactions-body');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-tx');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                const tr = deleteBtn.closest('tr');
                tr.style.opacity = '0';
                tr.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    tr.remove();
                    showToast(`Transaction ${id} archived`, 'info');
                }, 300);
            }
        });
    }

    // --- 13. AVATAR UPLOADER & PRESET PICKER ---
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const btnPresetAvatar = document.getElementById('btn-preset-avatar');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const modalAvatar = document.getElementById('modal-avatar');
    const btnCloseAvatarModal = document.getElementById('btn-close-avatar-modal');
    const btnSaveAvatarModal = document.getElementById('btn-save-avatar-modal');
    const btnTriggerFileUpload = document.getElementById('btn-trigger-file-upload');

    const updateAvatar = (newAvatarUrl) => {
        const avatars = ['sidebar-user-avatar', 'header-user-avatar', 'settings-avatar-preview'];
        avatars.forEach(id => {
            const img = document.getElementById(id);
            if (img) img.src = newAvatarUrl;
        });

        const currentUser = AuthModule.getCurrentUser();
        if (currentUser) {
            currentUser.avatar = newAvatarUrl;
            AuthModule.setSession(currentUser);
        }
        showToast('Profile avatar updated successfully!', 'success');
    };

    // Trigger local file upload from button
    if (btnChangeAvatar && avatarFileInput) {
        btnChangeAvatar.addEventListener('click', () => avatarFileInput.click());
    }

    if (btnTriggerFileUpload && avatarFileInput) {
        btnTriggerFileUpload.addEventListener('click', () => avatarFileInput.click());
    }

    // Open avatar presets modal
    if (btnPresetAvatar && modalAvatar) {
        btnPresetAvatar.addEventListener('click', () => modalAvatar.classList.remove('hidden'));
    }

    // Close avatar modal
    const closeAvatarModal = () => modalAvatar && modalAvatar.classList.add('hidden');
    if (btnCloseAvatarModal) btnCloseAvatarModal.addEventListener('click', closeAvatarModal);
    if (btnSaveAvatarModal) btnSaveAvatarModal.addEventListener('click', closeAvatarModal);

    // Read selected file from device
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showToast('File size exceeds 2MB limit. Please choose a smaller image.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (evt) => {
                    updateAvatar(evt.target.result);
                    closeAvatarModal();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Preset avatar image click selection
    document.querySelectorAll('.avatar-preset-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.avatar-preset-option').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
            updateAvatar(img.src);
        });
    });

    // Settings Form Save
    const settingsProfileForm = document.getElementById('settings-profile-form');
    if (settingsProfileForm) {
        settingsProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('settings-name').value;
            const email = document.getElementById('settings-email').value;
            const currentUser = AuthModule.getCurrentUser();
            if (currentUser) {
                currentUser.name = name;
                currentUser.email = email;
                AuthModule.setSession(currentUser);
                updateUserInfoUI(currentUser);
                showToast('Profile updated successfully!', 'success');
            }
        });
    }

    // Lucide Icons Initialization
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
