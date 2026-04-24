// Hod Project - Budget Tracker JavaScript
class BudgetTracker {
    constructor() {
        this.budget = 0;
        this.expenses = [];
        this.isSharedView = false;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.updateUI();
        this.checkSharedView();
    }

    // Local Storage Management
    loadFromLocalStorage() {
        if (this.isSharedView) {
            // Load shared data if in shared view
            const sharedData = localStorage.getItem('hodProjectSharedData');
            if (sharedData) {
                const data = JSON.parse(sharedData);
                this.budget = data.budget || 0;
                this.expenses = data.expenses || [];
            }
        } else {
            // Load normal data
            const savedData = localStorage.getItem('hodProjectData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.budget = data.budget || 0;
                this.expenses = data.expenses || [];
            }
        }
    }

    saveToLocalStorage() {
        if (this.isSharedView) {
            // In shared view, save to a temporary storage that won't persist
            const data = {
                budget: this.budget,
                expenses: this.expenses,
                lastUpdated: new Date().toISOString(),
                isShared: true
            };
            localStorage.setItem('hodProjectSharedData', JSON.stringify(data));
        } else {
            // Normal save for owner
            const data = {
                budget: this.budget,
                expenses: this.expenses,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('hodProjectData', JSON.stringify(data));
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Expense Form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Budget Edit
        document.getElementById('editBudgetBtn').addEventListener('click', () => {
            this.openBudgetModal();
        });

        // Budget Modal
        document.getElementById('saveBudgetBtn').addEventListener('click', () => {
            this.saveBudgetChanges();
        });

        // Modal Close Buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Budget Alert Actions
        document.getElementById('addFundsBtn').addEventListener('click', () => {
            this.openBudgetModal();
        });

        document.getElementById('resetBudgetBtn').addEventListener('click', () => {
            this.resetBudget();
        });

        document.getElementById('continueTrackingBtn').addEventListener('click', () => {
            this.continueTracking();
        });

        // Header Actions
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset everything? This action cannot be undone.')) {
                this.resetAll();
            }
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all expense history?')) {
                this.clearHistory();
            }
        });

        // Share Modal
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareLink();
        });

        // Modal Background Click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    // Expense Management
    addExpense() {
        const description = document.getElementById('expenseDescription').value.trim();
        const amount = parseFloat(document.getElementById('expenseAmount').value);

        if (!description || isNaN(amount) || amount <= 0) {
            this.showNotification('Please enter valid expense details', 'error');
            return;
        }

        const expense = {
            id: Date.now(),
            description,
            amount,
            date: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        this.saveToLocalStorage();
        this.updateUI();

        // Reset form
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDescription').focus();

        this.showNotification('Expense added successfully! ' + (this.isSharedView ? '(Shared Mode)' : ''), 'success');
    }

    // Budget Management
    openBudgetModal() {
        const modal = document.getElementById('editBudgetModal');
        document.getElementById('newBudgetAmount').value = this.budget > 0 ? this.budget : '';
        document.getElementById('addFundsAmount').value = '';
        this.openModal(modal);
    }

    saveBudgetChanges() {
        const newBudget = parseFloat(document.getElementById('newBudgetAmount').value);
        const addFunds = parseFloat(document.getElementById('addFundsAmount').value);

        if (isNaN(newBudget) && isNaN(addFunds)) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        if (!isNaN(newBudget) && newBudget > 0) {
            this.budget = newBudget;
        } else if (!isNaN(addFunds) && addFunds > 0) {
            this.budget += addFunds;
        }

        this.saveToLocalStorage();
        this.updateUI();
        this.closeModal(document.getElementById('editBudgetModal'));
        this.showNotification('Budget updated successfully', 'success');
    }

    resetBudget() {
        this.budget = 0;
        this.saveToLocalStorage();
        this.updateUI();
        this.hideBudgetAlert();
        this.showNotification('Budget reset successfully', 'success');
    }

    continueTracking() {
        this.hideBudgetAlert();
        this.showNotification('Continuing with negative balance tracking', 'info');
    }

    resetAll() {
        this.budget = 0;
        this.expenses = [];
        this.saveToLocalStorage();
        this.updateUI();
        this.hideBudgetAlert();
        this.showNotification('All data reset successfully', 'success');
    }

    clearHistory() {
        this.expenses = [];
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Expense history cleared', 'success');
    }

    // UI Updates
    updateUI() {
        this.updateBudgetDisplay();
        this.updateProgressBar();
        this.updateExpenseList();
        this.checkBudgetStatus();
    }

    updateBudgetDisplay() {
        const totalSpent = this.getTotalSpent();
        const remaining = this.budget - totalSpent;

        document.getElementById('totalBudget').textContent = this.formatCurrency(this.budget);
        document.getElementById('totalSpent').textContent = this.formatCurrency(totalSpent);
        document.getElementById('remainingBudget').textContent = this.formatCurrency(remaining);

        // Update remaining amount color
        const remainingElement = document.querySelector('.budget-amount.remaining');
        if (remaining < 0) {
            remainingElement.style.color = '#e74c3c';
        } else if (remaining === 0) {
            remainingElement.style.color = '#f39c12';
        } else {
            remainingElement.style.color = '#27ae60';
        }
    }

    updateProgressBar() {
        const totalSpent = this.getTotalSpent();
        const percentage = this.budget > 0 ? (totalSpent / this.budget) * 100 : 0;
        const clampedPercentage = Math.min(percentage, 100);

        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${clampedPercentage}%`;

        // Change color based on percentage
        if (percentage >= 100) {
            progressFill.style.background = 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)';
        } else if (percentage >= 80) {
            progressFill.style.background = 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
        }

        document.getElementById('progressPercentage').textContent = `${Math.round(clampedPercentage)}%`;
    }

    updateExpenseList() {
        const expenseList = document.getElementById('expenseList');
        
        if (this.expenses.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <p>No expenses recorded yet. Start tracking your spending!</p>
                </div>
            `;
            return;
        }

        expenseList.innerHTML = this.expenses.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-details">
                    <div class="expense-description">${this.escapeHtml(expense.description)}</div>
                    <div class="expense-date">${this.formatDate(expense.date)}</div>
                </div>
                <div class="expense-amount">-${this.formatCurrency(expense.amount)}</div>
            </div>
        `).join('');
    }

    checkBudgetStatus() {
        const totalSpent = this.getTotalSpent();
        const remaining = this.budget - totalSpent;

        if (remaining <= 0 && this.budget > 0) {
            this.showBudgetAlert();
        } else {
            this.hideBudgetAlert();
        }
    }

    showBudgetAlert() {
        const alert = document.getElementById('budgetAlert');
        alert.classList.remove('hidden');
    }

    hideBudgetAlert() {
        const alert = document.getElementById('budgetAlert');
        alert.classList.add('hidden');
    }

    // Share Functionality
    openShareModal() {
        const modal = document.getElementById('shareModal');
        const shareUrl = this.generateShareUrl();
        document.getElementById('shareLink').value = shareUrl;
        this.openModal(modal);
    }

    generateShareUrl() {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareData = btoa(JSON.stringify({
            budget: this.budget,
            expenses: this.expenses,
            shared: true
        }));
        return `${baseUrl}?share=${shareData}`;
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        this.showNotification('Share link copied to clipboard!', 'success');
    }

    checkSharedView() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');
        
        if (shareData) {
            try {
                const data = JSON.parse(atob(shareData));
                this.budget = data.budget;
                this.expenses = data.expenses;
                this.isSharedView = true;
                // Initialize shared data storage
                localStorage.setItem('hodProjectSharedData', JSON.stringify({
                    budget: this.budget,
                    expenses: this.expenses,
                    lastUpdated: new Date().toISOString(),
                    isShared: true
                }));
                this.updateUI();
                this.disableEditing();
            } catch (error) {
                console.error('Invalid share data:', error);
            }
        }
    }

    disableEditing() {
        // Only disable budget editing in shared view, allow expense addition
        document.getElementById('editBudgetBtn').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'none';
        document.getElementById('clearHistoryBtn').style.display = 'none';
        document.getElementById('shareBtn').style.display = 'none';
        
        // Add shared view indicator
        const header = document.querySelector('.header');
        const indicator = document.createElement('div');
        indicator.className = 'shared-indicator';
        indicator.innerHTML = '<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);">SHARED MODE</span>';
        header.appendChild(indicator);
        
        // Add note about shared mode
        const expenseSection = document.querySelector('.add-expense');
        const note = document.createElement('div');
        note.className = 'shared-note';
        note.innerHTML = '<p style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-top: 15px; text-align: center; font-style: italic;">You can add expenses to this shared budget</p>';
        expenseSection.appendChild(note);
    }

    // Modal Management
    openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Utility Functions
    getTotalSpent() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#27ae60';
                break;
            case 'error':
                notification.style.background = '#e74c3c';
                break;
            case 'info':
                notification.style.background = '#667eea';
                break;
        }

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BudgetTracker();
});

// Handle browser back/forward for shared views
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.shareData) {
        location.reload();
    }
});
