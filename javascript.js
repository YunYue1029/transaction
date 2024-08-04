function openModal() {
    $('#exampleModal').modal('show');
}

let db;

window.onload = function() {
    let request = indexedDB.open('budgetTracker', 1);

    request.onerror = function(event) {
        console.log('Database error: ' + event.target.errorCode);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        displayTransactions();
    };

    request.onupgradeneeded = function(event) {
        let db = event.target.result;
        let objectStore = db.createObjectStore('transactions', { autoIncrement: true });
        objectStore.createIndex('type', 'type', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('amount', 'amount', { unique: false });
        objectStore.createIndex('note', 'note', { unique: false });
    };
};

function saveTransaction() {
    const type = document.getElementById('type').value;
    const date = document.getElementById('transaction-date').value;
    const amount = document.getElementById('amount').value;
    const note = document.getElementById('note').value;

    const transaction = { type, date, amount, note };

    let transactionStore = db.transaction(['transactions'], 'readwrite').objectStore('transactions');
    let request = transactionStore.add(transaction);

    request.onsuccess = function(event) {
        console.log('Transaction added to the store', event.target.result);
        displayTransactions();
        $('#exampleModal').modal('hide');
    };

    request.onerror = function(event) {
        console.log('Error adding transaction', event.target.errorCode);
    };
}

function displayTransactions() {
    let transactionList = document.getElementById('transactions');
    transactionList.innerHTML = '';

    let totalIncome = 0;
    let totalExpenditure = 0;

    let objectStore = db.transaction('transactions').objectStore('transactions');
    objectStore.openCursor().onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            const { type, date, amount, note } = cursor.value;

            // 計算總收入和總支出
            if (type === 'income') {
                totalIncome += parseFloat(amount);
            } else if (type === 'expenditure') {
                totalExpenditure += parseFloat(amount);
            }

            let listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                ${date} - ${type} - ${amount} - ${note}
                <button class="btn btn-danger btn-sm float-right" onclick="deleteTransaction(${cursor.key})">刪除</button>
            `;
            transactionList.appendChild(listItem);
            cursor.continue();
        } else {
            // 更新頁面上的收入、支出和餘額，不顯示小數點
            document.getElementById('income-amount').textContent = Math.round(totalIncome);
            document.getElementById('expenditure-amount').textContent = Math.round(totalExpenditure);
            document.getElementById('balance-amount').textContent = Math.round(totalIncome - totalExpenditure);
        }
    };
}

function deleteTransaction(id) {
    let transaction = db.transaction(['transactions'], 'readwrite');
    let objectStore = transaction.objectStore('transactions');
    let request = objectStore.delete(id);

    request.onsuccess = function(event) {
        console.log('Transaction deleted', id);
        displayTransactions();
    };

    request.onerror = function(event) {
        console.log('Error deleting transaction', event.target.errorCode);
    };
}