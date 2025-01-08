// Simulated database using localStorage
const ACCOUNTS_KEY = 'accounts';
const TRANSACTIONS_KEY = 'transactions';

// Utility to get data from localStorage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || {};
}

// Utility to save data to localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Initialize accounts and transactions
let accounts = getData(ACCOUNTS_KEY);
let transactions = getData(TRANSACTIONS_KEY);

const loginSection = document.getElementById('login-section');
const accountsSection = document.getElementById('accounts-section');
const transactionSection = document.getElementById('transaction-section');
const accountsList = document.getElementById('accounts-list');
const addAccountBtn = document.getElementById('add-account-btn');
const transactionForm = document.getElementById('transaction-form');
const transactionsTable = document.getElementById('transactions-table');
const errorMessage = document.getElementById('error-message');
const accountTitle = document.getElementById('account-title');
const backToAccounts = document.getElementById('back-to-accounts');

let currentAccount = null;
let lineNumber = 1; // Initialize line number

// Load accounts
function loadAccounts() {
    accountsList.innerHTML = '';
    Object.keys(accounts).forEach(account => {
        const li = document.createElement('li');
        li.textContent = account;
        li.onclick = () => openAccount(account);
        accountsList.appendChild(li);
    });
}

// Add a new account
addAccountBtn.onclick = () => {
    const accountName = prompt('Enter account name:');
    if (accountName && !accounts[accountName]) {
        accounts[accountName] = { name: accountName };
        saveData(ACCOUNTS_KEY, accounts);
        loadAccounts();
    } else {
        alert('Account already exists or invalid name.');
    }
};

// Open account transactions
function openAccount(account) {
    currentAccount = account;
    accountTitle.textContent = `Transactions for ${account}`;
    transactionsTable.innerHTML = '';
    const accountTransactions = transactions[account] || [];
    accountTransactions.forEach(tx => addTransactionToTable(tx));
    accountsSection.style.display = 'none';
    transactionSection.style.display = 'block';
}

// Add a transaction
transactionForm.onsubmit = (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const slipNumber = document.getElementById('slip-number').value.trim();
    const description = document.getElementById('description').value.trim();
    const credit = parseFloat(document.getElementById('credit').value) || 0;
    const debit = parseFloat(document.getElementById('debit').value) || 0;
    const code = document.getElementById('code').value.trim();

    // Validation
    const accountTransactions = transactions[currentAccount] || [];
    if (accountTransactions.find(tx => tx.slipNumber === slipNumber)) {
        errorMessage.textContent = `Slip number ${slipNumber} already exists.`;
        return;
    }

    errorMessage.textContent = '';
    const total = credit - debit;
    const transaction = { date, slipNumber, description, credit, debit, total, code };

    // Save main transaction
    accountTransactions.push(transaction);
    transactions[currentAccount] = accountTransactions;

    // Save linked transaction if code exists and is valid
    if (code && accounts[code]) {
        const linkedTransactions = transactions[code] || [];
        const linkedTransaction = {
            date,
            slipNumber: slipNumber, // Keep the same slip number
            description: description, // Keep the same description
            credit: debit, // Opposite of main transaction
            debit: credit,
            total: debit - credit,
            code: currentAccount // Reference back to the main account
        };
        linkedTransactions.push(linkedTransaction);
        transactions[code] = linkedTransactions;
    }

    saveData(TRANSACTIONS_KEY, transactions);

    // Update table and reset form
    addTransactionToTable(transaction);
    transactionForm.reset();
};

// Add a transaction row to the table
function addTransactionToTable(transaction) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${lineNumber++}</td>
        <td>${transaction.date}</td>
        <td>${transaction.slipNumber}</td>
        <td>${transaction.description}</td>
        <td>${transaction.credit.toFixed(2)}</td>
        <td>${transaction.debit.toFixed(2)}</td>
        <td>${transaction.total.toFixed(2)}</td>
        <td>${transaction.code || '-'}</td>
    `;
    transactionsTable.appendChild(row);
}

// Return to accounts list
backToAccounts.onclick = () => {
    currentAccount = null;
    accountsSection.style.display = 'block';
    transactionSection.style.display = 'none';
    lineNumber = 1; // Reset line number when returning to accounts list
};

// Load initial accounts and transactions
loadAccounts();

// Handle PDF creation
document.getElementById('create-pdf-btn').onclick = () => {
    document.getElementById('pdf-options').style.display = 'block';
};

document.getElementById('whole-account').onclick = () => {
    generatePDF();
};

document.getElementById('partial-account').onclick = () => {
    const lineNumber = prompt('Enter the line number:');
    if (lineNumber) {
        generatePDF(parseInt(lineNumber));
    }
};

function generatePDF(endLine = null) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const rows = Array.from(transactionsTable.querySelectorAll('tr')).slice(1); // Skip header

    // Add current account name
    doc.text(10, 10, `Account: ${currentAccount}`);

    // Prepare table header
    const headers = [["Line", "Date", "Slip Number", "Description", "Credit", "Debit", "Total"]];
    let data = [];

    // Collect rows for the table
    rows.forEach((row, index) => {
        if (endLine && index + 1 > endLine) return;

        const cells = Array.from(row.querySelectorAll('td'));
        const rowData = [
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            parseFloat(cells[4].textContent).toFixed(2),
            parseFloat(cells[5].textContent).toFixed(2),
            parseFloat(cells[6].textContent).toFixed(2)
        ];
        data.push(rowData);
    });

    // Add table to PDF
    doc.autoTable({
        head: headers,
        body: data,
        startY: 20
    });

    doc.save(`${currentAccount}_account.pdf`);
}

// Login logic
document.getElementById('login-btn').onclick = () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'shahidabdulhakim' && password === 'shahid2170') {
        loginSection.style.display = 'none';
        accountsSection.style.display = 'block';
    } else {
        document.getElementById('login-error').textContent = 'Invalid username or password.';
    }
};

window.onload = () => {
    loginSection.style.display = 'block';
    accountsSection.style.display = 'none';
    transactionSection.style.display = 'none';
};
