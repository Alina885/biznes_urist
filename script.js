let loanChart = null;

function showFields(option) {
    resetForm();
    hideResults();

    document.getElementById('loanAmountField').style.display = (option === 'monthlyPayment' || option === 'loanTerm') ? 'block' : 'none';
    document.getElementById('monthlyPaymentField').style.display = (option === 'loanTerm' || option === 'maxLoanAmount') ? 'block' : 'none';
    document.getElementById('loanTermField').style.display = (option === 'monthlyPayment' || option === 'maxLoanAmount') ? 'block' : 'none';
    document.getElementById('paymentTypeField').style.display = (option === 'monthlyPayment') ? 'block' : 'none';
    document.getElementById('interestRateField').style.display = 'block';
}

function resetForm() {
    document.getElementById('loanAmount').value = '';
    document.getElementById('monthlyPayment').value = '';
    document.getElementById('loanTerm').value = '';
    document.getElementById('interestRate').value = '';
    document.getElementById('termType').value = 'years';
    document.getElementById('paymentType').value = 'annuity';
}

function hideResults() {
    document.getElementById('scheduleTable').style.display = 'none';
    document.getElementById('summary').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'none';
    document.getElementById('loanDuration').style.display = 'none';
    document.getElementById('summaryContainer').style.display = 'none';

    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';

    if (loanChart) {
        loanChart.destroy();
        loanChart = null;
    }
}

function calculate() {
    const calcType = document.getElementById('calcType').value;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100 / 12;
    const termType = document.getElementById('termType').value;
    const paymentType = document.getElementById('paymentType').value;
    let loanTerm = parseFloat(document.getElementById('loanTerm').value) || 0;

    if (termType === 'years') {
        loanTerm *= 12; // Преобразуем срок в месяцы, если указаны годы
    }

    let totalPaid = 0, totalInterest = 0, totalPrincipal = 0;

    if (calcType === 'monthlyPayment') {
        let schedule = [];

        if (paymentType === 'annuity') {
            // Аннуитетные платежи
            const monthlyAnnuity = (loanAmount * interestRate) / (1 - Math.pow(1 + interestRate, -loanTerm));
            let remainingBalance = loanAmount;

            for (let i = 1; i <= loanTerm; i++) {
                const interestPayment = remainingBalance * interestRate;
                const principalPayment = monthlyAnnuity - interestPayment;
                remainingBalance -= principalPayment;

                schedule.push({
                    date: getNextDate(i), // Получаем дату
                    totalPayment: monthlyAnnuity,
                    principalPayment: principalPayment,
                    interestPayment: interestPayment,
                    remainingBalance: remainingBalance > 0 ? remainingBalance : 0
                });

                totalPaid += monthlyAnnuity;
                totalInterest += interestPayment;
                totalPrincipal += principalPayment;
            }
        } else if (paymentType === 'differentiated') {
            // Дифференцированные платежи
            const principalPayment = loanAmount / loanTerm; // Фиксированная часть основного долга
            let remainingBalance = loanAmount;

            for (let i = 1; i <= loanTerm; i++) {
                const interestPayment = remainingBalance * interestRate;
                const totalPayment = principalPayment + interestPayment;
                remainingBalance -= principalPayment;

                schedule.push({
                    date: getNextDate(i), // Получаем дату
                    totalPayment: totalPayment,
                    principalPayment: principalPayment,
                    interestPayment: interestPayment,
                    remainingBalance: remainingBalance > 0 ? remainingBalance : 0
                });

                totalPaid += totalPayment;
                totalInterest += interestPayment;
                totalPrincipal += principalPayment;
            }
        }
        document.getElementById('monthlyPaymentResult').innerText = (totalPaid / loanTerm).toFixed(2);
        document.getElementById('totalInterestResult').innerText = totalInterest.toFixed(2);
        document.getElementById('totalDebtWithInterestResult').innerText = (loanAmount + totalInterest).toFixed(2);
        document.getElementById('summaryContainer').style.display = 'block';

        renderResults(schedule, totalPaid, totalPrincipal, totalInterest);
    }

    if (calcType === 'loanTerm') {
        let months = 0;
        let remainingBalance = loanAmount;
        let schedule = [];

        while (remainingBalance > 0 && monthlyPayment > interestRate * remainingBalance) {  // Fix: avoid infinite loop
            const interestPayment = remainingBalance * interestRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance -= principalPayment;

            schedule.push({
                date: getNextDate(++months), // Получаем дату
                totalPayment: monthlyPayment,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                remainingBalance: remainingBalance > 0 ? remainingBalance : 0
            });

            totalPaid += monthlyPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
        }

        const loanYears = Math.floor(months / 12);
        const loanMonths = months % 12;

        document.getElementById('loanYears').innerText = loanYears;
        document.getElementById('loanMonths').innerText = loanMonths;
        document.getElementById('loanDuration').style.display = 'block';
        document.getElementById('totalInterestResult').innerText = totalInterest.toFixed(2);
        document.getElementById('totalDebtWithInterestResult').innerText = (loanAmount + totalInterest).toFixed(2);
        document.getElementById('summaryContainer').style.display = 'block';

        renderResults(schedule, totalPaid, totalPrincipal, totalInterest);
    }

    if (calcType === 'maxLoanAmount') {
        const loanTerm = parseFloat(document.getElementById('loanTerm').value) || 0;
        let loanTermMonths = loanTerm;

        if (termType === 'years') {
            loanTermMonths = loanTerm * 12;
        }

        let maxLoanAmount = monthlyPayment * (1 - Math.pow(1 + interestRate, -loanTermMonths)) / interestRate;

        let schedule = [];
        let remainingBalance = maxLoanAmount;

        for (let i = 1; i <= loanTermMonths; i++) {
            const interestPayment = remainingBalance * interestRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance -= principalPayment;

            schedule.push({
                date: getNextDate(i), // Получаем дату
                totalPayment: monthlyPayment,
                principalPayment: principalPayment,
                interestPayment: interestPayment,
                remainingBalance: remainingBalance > 0 ? remainingBalance : 0
            });

            totalPaid += monthlyPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
        }
        document.getElementById('monthlyPaymentResult').innerText = monthlyPayment.toFixed(2);
        document.getElementById('totalInterestResult').innerText = totalInterest.toFixed(2);
        document.getElementById('totalDebtWithInterestResult').innerText = (maxLoanAmount + totalInterest).toFixed(2);
        document.getElementById('summaryContainer').style.display = 'block';

        renderResults(schedule, totalPaid, totalPrincipal, totalInterest);
    }
}


function renderResults(schedule, totalPaid, totalPrincipal, totalInterest) {
    const scheduleTable = document.getElementById('scheduleTable');
    const tbody = scheduleTable.querySelector('tbody');
    tbody.innerHTML = '';

    schedule.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.date}</td> <!-- Выводим дату вместо номера месяца -->
            <td>${row.totalPayment.toFixed(2)}</td>
            <td>${row.principalPayment.toFixed(2)}</td>
            <td>${row.interestPayment.toFixed(2)}</td>
            <td>${row.remainingBalance.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalPaid').innerText = totalPaid.toFixed(2);
    document.getElementById('totalPrincipal').innerText = totalPrincipal.toFixed(2);
    document.getElementById('totalInterest').innerText = totalInterest.toFixed(2);

    document.getElementById('summary').style.display = 'block';
    document.getElementById('tableContainer').style.display = 'block';
    scheduleTable.style.display = 'table';

    renderChart(schedule);
}

function renderChart(schedule) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    if (loanChart) {
        loanChart.destroy();
    }

    const labels = schedule.map(row => row.date);
    const principalData = schedule.map(row => row.principalPayment);
    const interestData = schedule.map(row => row.interestPayment);
    const totalPayments = schedule.map(row => row.totalPayment);

    loanChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Основной долг',
                    data: principalData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    stack: 'Stack 0',
                },
                {
                    label: 'Проценты',
                    data: interestData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true
                },
                x: {
                    stacked: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        beforeLabel: function (tooltipItem) {
                            return `Ежемесячный платеж: ${totalPayments[tooltipItem.dataIndex].toFixed(2)} ₽`;
                        },
                        label: function (tooltipItem) {
                            const datasetLabel = tooltipItem.dataset.label;
                            const principal = principalData[tooltipItem.dataIndex];
                            const interest = interestData[tooltipItem.dataIndex];
                            
                            if (datasetLabel === 'Основной долг') {
                                return `Основной долг: ${principal.toFixed(2)} ₽`;
                            } else if (datasetLabel === 'Проценты') {
                                return `Проценты: ${interest.toFixed(2)} ₽`;
                            }
                        },
                        afterLabel: function (tooltipItem) {
                            const principal = principalData[tooltipItem.dataIndex];
                            const interest = interestData[tooltipItem.dataIndex];
                            return `Основной долг: ${principal.toFixed(2)} ₽, Проценты: ${interest.toFixed(2)} ₽`;
                        }
                    }
                }
            }
        }
    });

    document.getElementById('chartContainer').style.display = 'block';
}

function exportToExcel() {
    const table = document.getElementById('scheduleTable');
    const workbook = XLSX.utils.table_to_book(table, {sheet: "Расчет платежей"});
    const sheet = workbook.Sheets["Расчет платежей"];
    const wscols = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLength = 10; // Минимальная ширина для колонки
        for (let R = range.s.r; R <= range.e.r; ++R) {
            const cell_address = XLSX.utils.encode_cell({r: R, c: C});
            const cell = sheet[cell_address];
            if (cell && cell.v) {
                const cellValue = String(cell.v);
                maxLength = Math.max(maxLength, cellValue.length); // Считаем максимальную длину содержимого
            }
        }
        wscols.push({wch: maxLength});
    }
    sheet['!cols'] = wscols;
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({r: R, c: C});
            const cell = sheet[cell_address];

            if (cell) {
                if (!cell.s) cell.s = {};
                cell.s.alignment = { horizontal: "center", vertical: "center" };
                cell.s.numFmt = "@";
            }
        }
    }
    XLSX.writeFile(workbook, 'Расчет_платежей.xlsx');
}


function getNextDate(monthOffset) {
    const today = new Date();
    today.setMonth(today.getMonth() + monthOffset - 1);
    const month = today.toLocaleString('ru-RU', { month: 'long' });
    const year = today.getFullYear();
    return `${month} ${year}`;
}
