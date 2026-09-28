/* ==========================================================================
   DASHBOARD MODULE (js/dashboard.js)
   Handles Chart rendering, dynamic tables, team grid, activity feed, & data modals
   ========================================================================== */

const DashboardModule = (() => {
    // Initial State Data
    let transactionsData = [
        { id: 'TX-9021', customer: 'Acme Global Corp', date: '2026-09-28', amount: 4850.00, category: 'Enterprise License', status: 'Completed' },
        { id: 'TX-9020', customer: 'Stripe Integration', date: '2026-09-28', amount: 1250.00, category: 'SaaS Subscription', status: 'Completed' },
        { id: 'TX-9019', customer: 'Vercel Edge Cloud', date: '2026-09-27', amount: 890.50, category: 'API Usage', status: 'Completed' },
        { id: 'TX-9018', customer: 'Linear Systems', date: '2026-09-27', amount: 3200.00, category: 'Professional Services', status: 'Pending' },
        { id: 'TX-9017', customer: 'Supabase Data Labs', date: '2026-09-26', amount: 650.00, category: 'SaaS Subscription', status: 'Completed' },
        { id: 'TX-9016', customer: 'Figma Design Team', date: '2026-09-25', amount: 99.00, category: 'SaaS Subscription', status: 'Failed' },
        { id: 'TX-9015', customer: 'Postman Testing', date: '2026-09-25', amount: 2400.00, category: 'Enterprise License', status: 'Completed' }
    ];

    let teamMembers = [
        { name: 'Alex Morgan', role: 'Administrator', email: 'admin@nexus.io', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
        { name: 'Sarah Jenkins', role: 'Lead Architect', email: 'sarah@nexus.io', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
        { name: 'Marcus Chen', role: 'Senior Developer', email: 'marcus@nexus.io', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
        { name: 'Elena Rostova', role: 'Product Manager', email: 'elena@nexus.io', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80' },
        { name: 'David Kim', role: 'UI/UX Designer', email: 'david@nexus.io', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' }
    ];

    let activityLogs = [
        { title: 'New transaction TX-9021 recorded ($4,850.00)', time: '10 minutes ago', icon: 'dollar-sign' },
        { title: 'Sarah Jenkins updated production API config', time: '45 minutes ago', icon: 'settings' },
        { title: 'User authentication policy updated to 2FA Mandatory', time: '2 hours ago', icon: 'shield-check' },
        { title: 'System Automated Backup successful (4.2 GB)', time: '4 hours ago', icon: 'database' },
        { title: 'New team member David Kim invited', time: '1 day ago', icon: 'user-plus' }
    ];

    // Chart instances
    let revenueChartInstance = null;
    let trafficChartInstance = null;
    let loadChartInstance = null;

    // Table Pagination state
    let currentPage = 1;
    const itemsPerPage = 5;

    // Format Currency
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Render Transactions Data Table
    const renderTable = (filterStatus = 'all', searchQuery = '') => {
        const tbody = document.getElementById('transactions-body');
        if (!tbody) return;

        let filtered = transactionsData.filter(item => {
            const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchesSearch = searchQuery === '' || 
                item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });

        // Pagination Slice
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

        tbody.innerHTML = '';

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No transactions found matching your filter criteria.
                    </td>
                </tr>
            `;
        } else {
            pageItems.forEach(tx => {
                const tr = document.createElement('tr');
                const statusClass = tx.status.toLowerCase();

                tr.innerHTML = `
                    <td><strong>${tx.id}</strong></td>
                    <td>${tx.customer}</td>
                    <td>${tx.date}</td>
                    <td><strong>${formatMoney(tx.amount)}</strong></td>
                    <td><span class="text-muted">${tx.category}</span></td>
                    <td>
                        <span class="status-tag ${statusClass}">
                            • ${tx.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn-icon-ghost btn-sm btn-delete-tx" data-id="${tx.id}" title="Delete Record">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Update Pagination Info
        const pageInfo = document.getElementById('table-page-info');
        if (pageInfo) {
            const endItem = Math.min(startIndex + itemsPerPage, totalItems);
            pageInfo.textContent = `Showing ${totalItems > 0 ? startIndex + 1 : 0} to ${endItem} of ${totalItems} transactions`;
        }

        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');
        if (btnPrev) btnPrev.disabled = currentPage === 1;
        if (btnNext) btnNext.disabled = currentPage >= totalPages;

        if (window.lucide) window.lucide.createIcons();
    };

    // Render Team Members Grid
    const renderTeam = () => {
        const container = document.getElementById('team-cards-grid');
        if (!container) return;

        container.innerHTML = '';
        teamMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'member-card';
            card.innerHTML = `
                <img src="${member.avatar}" alt="${member.name}" class="member-avatar">
                <div>
                    <h3 class="member-name">${member.name}</h3>
                    <span class="member-role-badge">${member.role}</span>
                </div>
                <p class="member-email">${member.email}</p>
                <div class="mt-2" style="display:flex; gap:0.5rem;">
                    <button class="btn-outline btn-sm">Message</button>
                    <button class="btn-icon-ghost btn-sm"><i data-lucide="more-vertical"></i></button>
                </div>
            `;
            container.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();
    };

    // Render Activity Logs Timeline
    const renderActivityLogs = () => {
        const timeline = document.getElementById('activity-timeline');
        if (!timeline) return;

        timeline.innerHTML = '';
        activityLogs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-title">${log.title}</div>
                <div class="timeline-time">${log.time}</div>
            `;
            timeline.appendChild(item);
        });
    };

    // Initialize Revenue & User Growth Chart (Chart.js)
    const initRevenueChart = (period = '7d') => {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let revenueData = [12400, 18500, 15200, 24800, 21000, 29400, 32800];
        let userData = [450, 620, 590, 890, 780, 1100, 1350];

        if (period === '30d') {
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            revenueData = [64000, 82000, 95000, 128450];
            userData = [2200, 3100, 3900, 4820];
        } else if (period === '1y') {
            labels = ['Q1', 'Q2', 'Q3', 'Q4'];
            revenueData = [240000, 310000, 420000, 580000];
            userData = [9500, 14200, 18900, 24500];
        }

        if (revenueChartInstance) {
            revenueChartInstance.destroy();
        }

        revenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revenue ($)',
                        data: revenueData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'New Registrations',
                        data: userData,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#9ca3af' }
                    }
                }
            }
        });
    };

    // Initialize Donut Traffic Chart
    const initTrafficChart = () => {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        if (trafficChartInstance) {
            trafficChartInstance.destroy();
        }

        trafficChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Direct', 'Organic Search', 'Referral', 'Social Media'],
                datasets: [{
                    data: [42, 28, 18, 12],
                    backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                cutout: '75%'
            }
        });
    };

    // Analytics Load Chart
    const initAnalyticsLoadChart = () => {
        const ctx = document.getElementById('analyticsLoadChart');
        if (!ctx) return;

        if (loadChartInstance) {
            loadChartInstance.destroy();
        }

        loadChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Server Requests (Req/sec)',
                    data: [1200, 800, 3400, 5800, 4900, 2100],
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#9ca3af' } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' } },
                    y: { ticks: { color: '#9ca3af' } }
                }
            }
        });
    };

    // Add New Transaction
    const addTransaction = ({ customer, amount, category, status }) => {
        const newTx = {
            id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
            customer,
            date: new Date().toISOString().split('T')[0],
            amount: parseFloat(amount),
            category,
            status
        };

        transactionsData.unshift(newTx);
        renderTable();

        // Add to activity logs
        activityLogs.unshift({
            title: `Recorded new transaction ${newTx.id} (${formatMoney(newTx.amount)})`,
            time: 'Just now',
            icon: 'dollar-sign'
        });
        renderActivityLogs();
    };

    // Add Team Member
    const addTeamMember = ({ name, email, role }) => {
        teamMembers.unshift({
            name,
            email,
            role,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*100000)}?w=120&auto=format&fit=crop&q=80` || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
        });
        renderTeam();
    };

    // Live Clock Update
    const startLiveClock = () => {
        const clockEl = document.getElementById('live-clock');
        const greetingEl = document.getElementById('greeting-time');
        
        const update = () => {
            const now = new Date();
            if (clockEl) clockEl.textContent = now.toLocaleTimeString();

            if (greetingEl) {
                const hour = now.getHours();
                if (hour < 12) greetingEl.textContent = 'Good Morning,';
                else if (hour < 18) greetingEl.textContent = 'Good Afternoon,';
                else greetingEl.textContent = 'Good Evening,';
            }
        };

        update();
        setInterval(update, 1000);
    };

    // Set page number
    const setPage = (page) => {
        currentPage = page;
        renderTable();
    };

    return {
        renderTable,
        renderTeam,
        renderActivityLogs,
        initRevenueChart,
        initTrafficChart,
        initAnalyticsLoadChart,
        addTransaction,
        addTeamMember,
        startLiveClock,
        setPage,
        getPage: () => currentPage
    };
})();
