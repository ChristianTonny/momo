// Dashboard State
const dashboardState = {
    currentPage: 1,
    filters: {},
    charts: {},
    stats: null
};

// Utility Functions
const formatCurrency = (amount) => {
    if (!amount) return '0 RWF';
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0
    }).format(amount).replace('RWF', 'RWF');
};

const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getTransactionTypeColor = (type) => {
    const colors = {
        'INCOMING_MONEY': '#28a745',
        'TRANSFER_TO_MOBILE': '#007bff',
        'BANK_DEPOSIT': '#ffc107',
        'PAYMENT_TO_CODE': '#dc3545',
        'AIRTIME_PAYMENT': '#6c757d',
        'CASH_POWER_PAYMENT': '#17a2b8',
        'AGENT_WITHDRAWAL': '#fd7e14',
        'BUNDLE_PURCHASE': '#6f42c1',
        'THIRD_PARTY_TRANSACTION': '#e83e8c',
        'UNKNOWN': '#495057'
    };
    return colors[type] || '#495057';
};

const formatTransactionType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Loading Management
const showLoading = () => {
    document.getElementById('loadingOverlay').classList.add('active');
};

const hideLoading = () => {
    document.getElementById('loadingOverlay').classList.remove('active');
};

// API Functions
const api = {
    async fetchStats() {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    async fetchTransactions(filters = {}, page = 1) {
        const params = new URLSearchParams({
            page,
            limit: 50,
            ...filters
        });
        
        const response = await fetch(`/api/transactions?${params}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    async fetchTransactionTypes() {
        const response = await fetch('/api/transaction-types');
        if (!response.ok) throw new Error('Failed to fetch transaction types');
        return response.json();
    }
};

// Dashboard Functions
const loadDashboardStats = async () => {
    try {
        const stats = await api.fetchStats();
        dashboardState.stats = stats;
        
        // Update overview cards
        document.getElementById('totalTransactions').textContent = 
            stats.totalTransactions?.count || 0;
        
        document.getElementById('totalAmount').textContent = 
            formatCurrency(stats.totalAmount?.total || 0);
        
        document.getElementById('totalFees').textContent = 
            formatCurrency(stats.totalFees?.total || 0);
        
        const avgAmount = stats.totalTransactions?.count > 0 ? 
            (stats.totalAmount?.total || 0) / stats.totalTransactions.count : 0;
        document.getElementById('avgTransaction').textContent = formatCurrency(avgAmount);
        
        // Update last updated time
        document.getElementById('lastUpdated').textContent = 
            new Date().toLocaleTimeString();
        
        return stats;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        return null;
    }
};

const loadTransactionTypes = async () => {
    try {
        const types = await api.fetchTransactionTypes();
        const select = document.getElementById('transactionType');
        
        // Clear existing options except "All Types"
        select.innerHTML = '<option value="all">All Types</option>';
        
        // Add transaction types
        types.forEach(type => {
            if (type.type_name !== 'OTP_MESSAGE') {
                const option = document.createElement('option');
                option.value = type.type_name;
                option.textContent = formatTransactionType(type.type_name);
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading transaction types:', error);
    }
};

const loadTransactions = async (page = 1) => {
    try {
        showLoading();
        const data = await api.fetchTransactions(dashboardState.filters, page);
        
        dashboardState.currentPage = page;
        renderTransactionsTable(data.transactions);
        updatePagination(data.pagination);
        
        return data;
    } catch (error) {
        console.error('Error loading transactions:', error);
        return null;
    } finally {
        hideLoading();
    }
};

const renderTransactionsTable = (transactions) => {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 2rem;">
                    No transactions found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date_timestamp)}</td>
            <td>
                <span class="transaction-type type-${transaction.transaction_type}">
                    ${formatTransactionType(transaction.transaction_type)}
                </span>
            </td>
            <td style="font-weight: 600; color: #2c3e50;">
                ${formatCurrency(transaction.amount)}
            </td>
            <td>${formatCurrency(transaction.fee)}</td>
            <td>
                ${transaction.recipient_name || transaction.sender_name || 'N/A'}
                ${transaction.recipient_phone || transaction.sender_phone ? 
                    `<br><small style="color: #666;">${transaction.recipient_phone || transaction.sender_phone}</small>` : ''}
            </td>
            <td style="font-weight: 600; color: #28a745;">
                ${formatCurrency(transaction.balance_after)}
            </td>
        </tr>
    `).join('');
};

const updatePagination = (pagination) => {
    const { page, totalPages, total } = pagination;
    
    document.getElementById('currentPageInfo').textContent = `Page ${page} of ${totalPages}`;
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    
    prevBtn.onclick = () => {
        if (page > 1) loadTransactions(page - 1);
    };
    
    nextBtn.onclick = () => {
        if (page < totalPages) loadTransactions(page + 1);
    };
};

// Chart Functions
const createTypeDistributionChart = (stats) => {
    const ctx = document.getElementById('typeDistributionChart').getContext('2d');
    
    if (dashboardState.charts.typeDistribution) {
        dashboardState.charts.typeDistribution.destroy();
    }
    
    const typeStats = stats.transactionTypes || [];
    const labels = typeStats.map(t => formatTransactionType(t.transaction_type));
    const data = typeStats.map(t => t.count);
    const colors = typeStats.map(t => getTransactionTypeColor(t.transaction_type));
    
    dashboardState.charts.typeDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label;
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
};

const createVolumeChart = (stats) => {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    if (dashboardState.charts.volume) {
        dashboardState.charts.volume.destroy();
    }
    
    const monthlyStats = stats.monthlyStats || [];
    const labels = monthlyStats.map(m => m.month).reverse();
    const amounts = monthlyStats.map(m => m.total_amount || 0).reverse();
    const counts = monthlyStats.map(m => m.transaction_count || 0).reverse();
    
    dashboardState.charts.volume = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Transaction Volume (RWF)',
                    data: amounts,
                    borderColor: '#003366',
                    backgroundColor: 'rgba(0, 51, 102, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Transaction Count',
                    data: counts,
                    borderColor: '#FFCB00',
                    backgroundColor: 'rgba(255, 203, 0, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Amount (RWF)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label;
                            const value = context.parsed.y;
                            if (label.includes('Volume')) {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
};

// Filter Functions
const applyFilters = () => {
    const filters = {};
    
    const type = document.getElementById('transactionType').value;
    if (type && type !== 'all') filters.type = type;
    
    const startDate = document.getElementById('startDate').value;
    if (startDate) filters.startDate = startDate;
    
    const endDate = document.getElementById('endDate').value;
    if (endDate) filters.endDate = endDate;
    
    const search = document.getElementById('searchQuery').value.trim();
    if (search) filters.search = search;
    
    dashboardState.filters = filters;
    loadTransactions(1);
};

const clearFilters = () => {
    document.getElementById('transactionType').value = 'all';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('searchQuery').value = '';
    
    dashboardState.filters = {};
    loadTransactions(1);
};

// Event Listeners
const initEventListeners = () => {
    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Search on Enter key
    document.getElementById('searchQuery').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Pagination buttons
    document.getElementById('prevPage').addEventListener('click', () => {
        if (dashboardState.currentPage > 1) {
            loadTransactions(dashboardState.currentPage - 1);
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        loadTransactions(dashboardState.currentPage + 1);
    });
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        loadDashboardStats();
        loadTransactions(dashboardState.currentPage);
    }, 5 * 60 * 1000);
};

// Initialize Dashboard
const initDashboard = async () => {
    try {
        showLoading();
        
        // Load initial data
        await Promise.all([
            loadTransactionTypes(),
            loadDashboardStats().then(stats => {
                if (stats) {
                    createTypeDistributionChart(stats);
                    createVolumeChart(stats);
                }
            }),
            loadTransactions(1)
        ]);
        
        // Initialize event listeners
        initEventListeners();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    } finally {
        hideLoading();
    }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard); 