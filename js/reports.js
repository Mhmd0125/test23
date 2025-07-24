// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    populateDropdowns();
    setupFormSubmissions();

    // تعيين الشهر الافتراضي
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const reportWorkerMonth = document.getElementById('reportWorkerMonth');
    const reportContractorMonth = document.getElementById('reportContractorMonth');
    const reportWorkshopMonth = document.getElementById('reportWorkshopMonth');
    const reportMonth = document.getElementById('reportMonth');

    if (reportWorkerMonth) reportWorkerMonth.value = currentMonth;
    if (reportContractorMonth) reportContractorMonth.value = currentMonth;
    if (reportWorkshopMonth) reportWorkshopMonth.value = currentMonth;
    if (reportMonth) reportMonth.value = currentMonth;
});

// إعداد التنقل بين علامات التبويب
function setupTabNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع العناصر
            tabItems.forEach(tab => tab.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // إضافة الفئة النشطة للعنصر المحدد
            item.classList.add('active');

            // إظهار المحتوى المرتبط
            const tabId = item.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
}

// تعبئة القوائم المنسدلة
function populateDropdowns() {
    populateWorkerDropdown();
    populateContractorDropdown();
    populateWorkshopDropdown();
}

// تعبئة قائمة العمال
function populateWorkerDropdown() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerSelect = document.getElementById('reportWorker');

    if (!workerSelect) return;

    // مسح الخيارات الحالية
    workerSelect.innerHTML = '<option value="">اختر العامل</option>';

    // إضافة العمال النشطين فقط
    const activeWorkers = workers.filter(worker => worker.active);

    activeWorkers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = `${worker.name} (${worker.contractorName || 'بدون مقاول'})`;
        workerSelect.appendChild(option);
    });
}

// تعبئة قائمة المقاولين
function populateContractorDropdown() {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractorSelect = document.getElementById('reportContractor');

    if (!contractorSelect) return;

    // مسح الخيارات الحالية
    contractorSelect.innerHTML = '<option value="">اختر المقاول</option>';

    // إضافة المقاولين
    contractors.forEach(contractor => {
        const option = document.createElement('option');
        option.value = contractor.id;
        option.textContent = contractor.name;
        contractorSelect.appendChild(option);
    });
}

// تعبئة قائمة الورش
function populateWorkshopDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshopSelect = document.getElementById('reportWorkshop');

    if (!workshopSelect) return;

    // مسح الخيارات الحالية
    workshopSelect.innerHTML = '<option value="">اختر الورشة</option>';

    // إضافة الورش
    workshops.forEach(workshop => {
        const option = document.createElement('option');
        option.value = workshop.id;
        option.textContent = workshop.name;
        workshopSelect.appendChild(option);
    });
}

// إعداد معالجات تقديم النماذج
function setupFormSubmissions() {
    // أزرار توليد التقارير
    const generateWorkerReportBtn = document.getElementById('generateWorkerReport');
    const generateContractorReportBtn = document.getElementById('generateContractorReport');
    const generateWorkshopReportBtn = document.getElementById('generateWorkshopReport');
    const generateMonthlyReportBtn = document.getElementById('generateMonthlyReport');

    if (generateWorkerReportBtn) {
        generateWorkerReportBtn.addEventListener('click', generateWorkerReport);
    }

    if (generateContractorReportBtn) {
        generateContractorReportBtn.addEventListener('click', generateContractorReport);
    }

    if (generateWorkshopReportBtn) {
        generateWorkshopReportBtn.addEventListener('click', generateWorkshopReport);
    }

    if (generateMonthlyReportBtn) {
        generateMonthlyReportBtn.addEventListener('click', generateMonthlyReport);
    }
}



// تنسيق التاريخ بالعربية
function formatDateArabic(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

// توليد تقرير العامل
function generateWorkerReport() {
    const workerId = document.getElementById('reportWorker').value;
    const monthStr = document.getElementById('reportWorkerMonth').value;
    const resultContainer = document.getElementById('workerReportResult');
    
    if (!workerId) {
        alert('الرجاء اختيار عامل');
        return;
    }
    
    // الحصول على بيانات العامل
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const worker = workers.find(w => w.id == workerId);
    
    if (!worker) {
        resultContainer.innerHTML = '<p class="error">لم يتم العثور على العامل</p>';
        return;
    }
    
    // الحصول على سجلات الحضور للعامل
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workerAttendance = attendance.filter(a => 
        a.workerId == workerId && 
        a.date >= startDate && 
        a.date <= endDate
    );
    
    // ترتيب السجلات حسب التاريخ
    workerAttendance.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // حساب الإحصائيات
    const totalFullDays = workerAttendance.filter(a => a.fullDay).length;
    const totalHalfDays = workerAttendance.filter(a => !a.fullDay).length;
    const totalOvertime = workerAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0);
    const totalAdvance = workerAttendance.reduce((sum, a) => sum + (a.advance || 0), 0);
    const totalSmoking = workerAttendance.reduce((sum, a) => sum + (a.smoking || 0), 0);
    
    // حساب إجمالي الراتب
    const fullDayWage = worker.dailyWage || 0;
    const halfDayWage = fullDayWage / 2;
    const overtimeRate = worker.overtimeRate || 0;
    
    const fullDaysTotal = totalFullDays * fullDayWage;
    const halfDaysTotal = totalHalfDays * halfDayWage;
    const overtimeTotal = totalOvertime * overtimeRate;
    
    const grossTotal = fullDaysTotal + halfDaysTotal + overtimeTotal;
    const deductions = totalAdvance + totalSmoking;
    const netTotal = grossTotal - deductions;
    
    // إنشاء التقرير
    let reportHTML = `
        <div class="report-header">
            <h3>تقرير العامل: ${worker.name}</h3>
            <p>الفترة: ${formatDateArabic(startDate)} إلى ${formatDateArabic(endDate)}</p>
            <p>المقاول: ${worker.contractorName || 'بدون مقاول'}</p>
        </div>
        
        <div class="report-summary">
            <div class="summary-item">
                <span class="label">أيام كاملة:</span>
                <span class="value">${totalFullDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">أنصاف أيام:</span>
                <span class="value">${totalHalfDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">ساعات إضافية:</span>
                <span class="value">${totalOvertime} ساعة</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي السلف:</span>
                <span class="value">${totalAdvance} شيكل</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي التدخين:</span>
                <span class="value">${totalSmoking} شيكل</span>
            </div>
        </div>
        
        <div class="report-financial">
            <h4>الحساب المالي</h4>
            <div class="financial-item">
                <span class="label">أجر الأيام الكاملة:</span>
                <span class="value">${fullDaysTotal} شيكل</span>
                <span class="details">(${totalFullDays} × ${fullDayWage})</span>
            </div>
            <div class="financial-item">
                <span class="label">أجر أنصاف الأيام:</span>
                <span class="value">${halfDaysTotal} شيكل</span>
                <span class="details">(${totalHalfDays} × ${halfDayWage})</span>
            </div>
            <div class="financial-item">
                <span class="label">أجر الساعات الإضافية:</span>
                <span class="value">${overtimeTotal} شيكل</span>
                <span class="details">(${totalOvertime} × ${overtimeRate})</span>
            </div>
            <div class="financial-item total">
                <span class="label">الإجمالي:</span>
                <span class="value">${grossTotal} شيكل</span>
            </div>
            <div class="financial-item deduction">
                <span class="label">خصم السلف:</span>
                <span class="value">-${totalAdvance} شيكل</span>
            </div>
            <div class="financial-item deduction">
                <span class="label">خصم التدخين:</span>
                <span class="value">-${totalSmoking} شيكل</span>
            </div>
            <div class="financial-item net-total">
                <span class="label">صافي المستحق:</span>
                <span class="value">${netTotal} شيكل</span>
            </div>
        </div>
    `;
    
    // إضافة جدول تفاصيل الحضور
    if (workerAttendance.length > 0) {
        reportHTML += `
            <div class="report-details">
                <h4>تفاصيل الحضور</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الورشة</th>
                            <th>نوع اليوم</th>
                            <th>الساعات الإضافية</th>
                            <th>السلف</th>
                            <th>التدخين</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        workerAttendance.forEach(att => {
            reportHTML += `
                <tr>
                    <td>${formatDateArabic(att.date)}</td>
                    <td>${att.workshop || '-'}</td>
                    <td>${att.fullDay ? 'يوم كامل' : 'نصف يوم'}</td>
                    <td>${att.overtime || 0}</td>
                    <td>${att.advance ? att.advance + ' شيكل' : '-'}</td>
                    <td>${att.smoking ? att.smoking + ' شيكل' : '-'}</td>
                    <td>${att.notes || '-'}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        reportHTML += `<p class="no-data">لا توجد سجلات حضور للفترة المحددة</p>`;
    }
    
    resultContainer.innerHTML = reportHTML;
}

// توليد تقرير المقاول
function generateContractorReport() {
    const contractorId = document.getElementById('contractorReportSelect').value;
    const startDate = document.getElementById('startDateContractor').value;
    const endDate = document.getElementById('endDateContractor').value;
    const resultContainer = document.getElementById('contractorReportResult');
    
    if (!contractorId) {
        alert('الرجاء اختيار مقاول');
        return;
    }
    
    // الحصول على بيانات المقاول
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id == contractorId);
    
    if (!contractor) {
        resultContainer.innerHTML = '<p class="error">لم يتم العثور على المقاول</p>';
        return;
    }
    
    // الحصول على عمال المقاول
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId == contractorId && w.active);
    
    // الحصول على سجلات الحضور لعمال المقاول
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const contractorAttendance = attendance.filter(a => 
        a.contractorId == contractorId && 
        a.date >= startDate && 
        a.date <= endDate
    );
    
    // تجميع البيانات حسب العامل
    const workerStats = {};
    
    contractorWorkers.forEach(worker => {
        workerStats[worker.id] = {
            name: worker.name,
            fullDays: 0,
            halfDays: 0,
            overtime: 0,
            advance: 0,
            smoking: 0,
            dailyWage: worker.dailyWage || 0,
            overtimeRate: worker.overtimeRate || 0
        };
    });
    
    contractorAttendance.forEach(att => {
        if (workerStats[att.workerId]) {
            if (att.fullDay) {
                workerStats[att.workerId].fullDays++;
            } else {
                workerStats[att.workerId].halfDays++;
            }
            
            workerStats[att.workerId].overtime += (att.overtime || 0);
            workerStats[att.workerId].advance += (att.advance || 0);
            workerStats[att.workerId].smoking += (att.smoking || 0);
        }
    });
    
    // حساب الإجماليات
    let totalFullDays = 0;
    let totalHalfDays = 0;
    let totalOvertime = 0;
    let totalAdvance = 0;
    let totalSmoking = 0;
    let totalGross = 0;
    let totalNet = 0;
    
    Object.values(workerStats).forEach(stat => {
        totalFullDays += stat.fullDays;
        totalHalfDays += stat.halfDays;
        totalOvertime += stat.overtime;
        totalAdvance += stat.advance;
        totalSmoking += stat.smoking;
        
        const workerGross = (stat.fullDays * stat.dailyWage) + 
                           (stat.halfDays * (stat.dailyWage / 2)) + 
                           (stat.overtime * stat.overtimeRate);
        
        const workerNet = workerGross - stat.advance - stat.smoking;
        
        totalGross += workerGross;
        totalNet += workerNet;
        
        // إضافة الإجماليات للعامل
        stat.gross = workerGross;
        stat.net = workerNet;
    });
    
    // إنشاء التقرير
    let reportHTML = `
        <div class="report-header">
            <h3>تقرير المقاول: ${contractor.name}</h3>
            <p>الفترة: ${formatDateArabic(startDate)} إلى ${formatDateArabic(endDate)}</p>
            <p>عدد العمال: ${contractorWorkers.length}</p>
        </div>
        
        <div class="report-summary">
            <div class="summary-item">
                <span class="label">إجمالي الأيام الكاملة:</span>
                <span class="value">${totalFullDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي أنصاف الأيام:</span>
                <span class="value">${totalHalfDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي الساعات الإضافية:</span>
                <span class="value">${totalOvertime} ساعة</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي السلف:</span>
                <span class="value">${totalAdvance} شيكل</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي التدخين:</span>
                <span class="value">${totalSmoking} شيكل</span>
            </div>
            <div class="summary-item total">
                <span class="label">إجمالي المستحقات:</span>
                <span class="value">${totalGross} شيكل</span>
            </div>
            <div class="summary-item net-total">
                <span class="label">صافي المستحقات:</span>
                <span class="value">${totalNet} شيكل</span>
            </div>
        </div>
    `;
    
    // إضافة جدول تفاصيل العمال
    if (contractorWorkers.length > 0) {
        reportHTML += `
            <div class="report-details">
                <h4>تفاصيل العمال</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>اسم العامل</th>
                            <th>أيام كاملة</th>
                            <th>أنصاف أيام</th>
                            <th>ساعات إضافية</th>
                            <th>السلف</th>
                            <th>التدخين</th>
                            <th>الإجمالي</th>
                            <th>الصافي</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.values(workerStats).forEach(stat => {
            reportHTML += `
                <tr>
                    <td>${stat.name}</td>
                    <td>${stat.fullDays}</td>
                    <td>${stat.halfDays}</td>
                    <td>${stat.overtime}</td>
                    <td>${stat.advance} شيكل</td>
                    <td>${stat.smoking} شيكل</td>
                    <td>${stat.gross} شيكل</td>
                    <td>${stat.net} شيكل</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        reportHTML += `<p class="no-data">لا يوجد عمال لهذا المقاول</p>`;
    }
    
    resultContainer.innerHTML = reportHTML;
}

// توليد تقرير الورشة
function generateWorkshopReport() {
    const workshopId = document.getElementById('workshopReportSelect').value;
    const monthStr = document.getElementById('reportMonthWorkshop').value;
    const resultContainer = document.getElementById('workshopReportResult');
    
    if (!workshopId || !monthStr) {
        alert('الرجاء اختيار الورشة والشهر');
        return;
    }
    
    // استخراج السنة والشهر
    const [year, month] = monthStr.split('-').map(Number);
    
    // تحديد نطاق التاريخ للشهر المحدد
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // تنسيق التاريخ بصيغة YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // الحصول على بيانات الورشة
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshop = workshops.find(w => w.id == workshopId);
    
    if (!workshop) {
        resultContainer.innerHTML = '<p class="error">لم يتم العثور على الورشة</p>';
        return;
    }
    
    // الحصول على سجلات الحضور للورشة
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshopAttendance = attendance.filter(a => 
        a.workshopId == workshopId && 
        a.date >= startDateStr && 
        a.date <= endDateStr
    );
    
    // تجميع البيانات حسب العامل
    const workerStats = {};
    const contractorStats = {};
    
    workshopAttendance.forEach(att => {
        // إحصائيات العامل
        if (!workerStats[att.workerId]) {
            workerStats[att.workerId] = {
                name: att.workerName,
                contractorId: att.contractorId,
                contractorName: att.contractorName || 'بدون مقاول',
                fullDays: 0,
                halfDays: 0,
                overtime: 0
            };
        }
        
        if (att.fullDay) {
            workerStats[att.workerId].fullDays++;
        } else {
            workerStats[att.workerId].halfDays++;
        }
        
        workerStats[att.workerId].overtime += (att.overtime || 0);
        
        // إحصائيات المقاول
        if (att.contractorId) {
            if (!contractorStats[att.contractorId]) {
                contractorStats[att.contractorId] = {
                    name: att.contractorName,
                    fullDays: 0,
                    halfDays: 0,
                    overtime: 0,
                    workers: new Set()
                };
            }
            
            if (att.fullDay) {
                contractorStats[att.contractorId].fullDays++;
            } else {
                contractorStats[att.contractorId].halfDays++;
            }
            
            contractorStats[att.contractorId].overtime += (att.overtime || 0);
            contractorStats[att.contractorId].workers.add(att.workerId);
        }
    });
    
    // تحويل Set إلى عدد العمال
    Object.values(contractorStats).forEach(stat => {
        stat.workersCount = stat.workers.size;
        delete stat.workers; // حذف Set بعد استخدامه
    });
    
    // إنشاء التقرير
    let reportHTML = `
        <div class="report-header">
            <h3>تقرير الورشة: ${workshop.name}</h3>
            <p>الفترة: ${formatDateArabic(startDateStr)} إلى ${formatDateArabic(endDateStr)}</p>
        </div>
    `;
    
    // إضافة جدول تفاصيل العمال
    if (Object.keys(workerStats).length > 0) {
        reportHTML += `
            <div class="report-details">
                <h4>تفاصيل العمال</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>اسم العامل</th>
                            <th>المقاول</th>
                            <th>أيام كاملة</th>
                            <th>أنصاف أيام</th>
                            <th>ساعات إضافية</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.values(workerStats).forEach(stat => {
            reportHTML += `
                <tr>
                    <td>${stat.name}</td>
                    <td>${stat.contractorName}</td>
                    <td>${stat.fullDays}</td>
                    <td>${stat.halfDays}</td>
                    <td>${stat.overtime}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        // إضافة جدول تفاصيل المقاولين
        if (Object.keys(contractorStats).length > 0) {
            reportHTML += `
                <div class="report-details">
                    <h4>تفاصيل المقاولين</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>اسم المقاول</th>
                                <th>عدد العمال</th>
                                <th>أيام كاملة</th>
                                <th>أنصاف أيام</th>
                                <th>ساعات إضافية</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            Object.values(contractorStats).forEach(stat => {
                reportHTML += `
                    <tr>
                        <td>${stat.name}</td>
                        <td>${stat.workersCount}</td>
                        <td>${stat.fullDays}</td>
                        <td>${stat.halfDays}</td>
                        <td>${stat.overtime}</td>
                    </tr>
                `;
            });
            
            reportHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
    } else {
        reportHTML += `<p class="no-data">لا توجد سجلات حضور للورشة في الفترة المحددة</p>`;
    }
    
    resultContainer.innerHTML = reportHTML;
}

// توليد التقرير الشهري
function generateMonthlyReport() {
    const monthStr = document.getElementById('reportMonth').value;
    const resultContainer = document.getElementById('monthlyReportResult');
    
    if (!monthStr) {
        alert('الرجاء اختيار الشهر');
        return;
    }
    
    // استخراج السنة والشهر
    const [year, month] = monthStr.split('-').map(Number);
    
    // تحديد نطاق التاريخ للشهر المحدد
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // تنسيق التاريخ بصيغة YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // الحصول على سجلات الحضور للشهر
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const monthlyAttendance = attendance.filter(a =>
        a.date >= startDateStr &&
        a.date <= endDateStr
    );
    
    // تجميع البيانات حسب المقاول
    const contractorStats = {};
    const workshopStats = {};
    
    // إحصائيات عامة
    const totalStats = {
        workers: new Set(),
        contractors: new Set(),
        workshops: new Set(),
        fullDays: 0,
        halfDays: 0,
        overtime: 0,
        advance: 0,
        smoking: 0
    };
    
    monthlyAttendance.forEach(att => {
        // إحصائيات عامة
        totalStats.workers.add(att.workerId);
        if (att.contractorId) totalStats.contractors.add(att.contractorId);
        if (att.workshopId) totalStats.workshops.add(att.workshopId);
        
        if (att.fullDay) {
            totalStats.fullDays++;
        } else {
            totalStats.halfDays++;
        }
        
        totalStats.overtime += (att.overtime || 0);
        totalStats.advance += (att.advance || 0);
        totalStats.smoking += (att.smoking || 0);
        
        // إحصائيات المقاول
        if (att.contractorId) {
            if (!contractorStats[att.contractorId]) {
                contractorStats[att.contractorId] = {
                    name: att.contractorName,
                    workers: new Set(),
                    fullDays: 0,
                    halfDays: 0,
                    overtime: 0,
                    advance: 0,
                    smoking: 0
                };
            }
            
            contractorStats[att.contractorId].workers.add(att.workerId);
            
            if (att.fullDay) {
                contractorStats[att.contractorId].fullDays++;
            } else {
                contractorStats[att.contractorId].halfDays++;
            }
            
            contractorStats[att.contractorId].overtime += (att.overtime || 0);
            contractorStats[att.contractorId].advance += (att.advance || 0);
            contractorStats[att.contractorId].smoking += (att.smoking || 0);
        }
        
        // إحصائيات الورشة
        if (att.workshopId) {
            if (!workshopStats[att.workshopId]) {
                workshopStats[att.workshopId] = {
                    name: att.workshop,
                    workers: new Set(),
                    fullDays: 0,
                    halfDays: 0,
                    overtime: 0
                };
            }
            
            workshopStats[att.workshopId].workers.add(att.workerId);
            
            if (att.fullDay) {
                workshopStats[att.workshopId].fullDays++;
            } else {
                workshopStats[att.workshopId].halfDays++;
            }
            
            workshopStats[att.workshopId].overtime += (att.overtime || 0);
        }
    });
    
    // تحويل Set إلى أعداد
    totalStats.workersCount = totalStats.workers.size;
    totalStats.contractorsCount = totalStats.contractors.size;
    totalStats.workshopsCount = totalStats.workshops.size;
    
    Object.values(contractorStats).forEach(stat => {
        stat.workersCount = stat.workers.size;
        delete stat.workers;
    });
    
    Object.values(workshopStats).forEach(stat => {
        stat.workersCount = stat.workers.size;
        delete stat.workers;
    });
    
    // إنشاء التقرير
    let reportHTML = `
        <div class="report-header">
            <h3>التقرير الشهري: ${new Date(year, month - 1).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}</h3>
            <p>الفترة: ${formatDateArabic(startDateStr)} إلى ${formatDateArabic(endDateStr)}</p>
        </div>
        
        <div class="report-summary">
            <div class="summary-item">
                <span class="label">عدد العمال:</span>
                <span class="value">${totalStats.workersCount}</span>
            </div>
            <div class="summary-item">
                <span class="label">عدد المقاولين:</span>
                <span class="value">${totalStats.contractorsCount}</span>
            </div>
            <div class="summary-item">
                <span class="label">عدد الورش:</span>
                <span class="value">${totalStats.workshopsCount}</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي الأيام الكاملة:</span>
                <span class="value">${totalStats.fullDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي أنصاف الأيام:</span>
                <span class="value">${totalStats.halfDays} يوم</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي الساعات الإضافية:</span>
                <span class="value">${totalStats.overtime} ساعة</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي السلف:</span>
                <span class="value">${totalStats.advance} شيكل</span>
            </div>
            <div class="summary-item">
                <span class="label">إجمالي التدخين:</span>
                <span class="value">${totalStats.smoking} شيكل</span>
            </div>
        </div>
    `;
    
    // إضافة جدول تفاصيل المقاولين
    if (Object.keys(contractorStats).length > 0) {
        reportHTML += `
            <div class="report-details">
                <h4>تفاصيل المقاولين</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>اسم المقاول</th>
                            <th>عدد العمال</th>
                            <th>أيام كاملة</th>
                            <th>أنصاف أيام</th>
                            <th>ساعات إضافية</th>
                            <th>السلف</th>
                            <th>التدخين</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.values(contractorStats).forEach(stat => {
            reportHTML += `
                <tr>
                    <td>${stat.name}</td>
                    <td>${stat.workersCount}</td>
                    <td>${stat.fullDays}</td>
                    <td>${stat.halfDays}</td>
                    <td>${stat.overtime}</td>
                    <td>${stat.advance} شيكل</td>
                    <td>${stat.smoking} شيكل</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // إضافة جدول تفاصيل الورش
    if (Object.keys(workshopStats).length > 0) {
        reportHTML += `
            <div class="report-details">
                <h4>تفاصيل الورش</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>اسم الورشة</th>
                            <th>عدد العمال</th>
                            <th>أيام كاملة</th>
                            <th>أنصاف أيام</th>
                            <th>ساعات إضافية</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Object.values(workshopStats).forEach(stat => {
            reportHTML += `
                <tr>
                    <td>${stat.name}</td>
                    <td>${stat.workersCount}</td>
                    <td>${stat.fullDays}</td>
                    <td>${stat.halfDays}</td>
                    <td>${stat.overtime}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    resultContainer.innerHTML = reportHTML;
}

// تصدير إلى PDF
function exportToPdf(containerId, filename) {
    alert('سيتم تنفيذ تصدير PDF في الإصدار القادم');
    // يمكن استخدام مكتبة مثل html2pdf.js أو jsPDF لتنفيذ هذه الوظيفة
    // مثال:
    // html2pdf(document.getElementById(containerId), {
    //     filename: `${filename}.pdf`,
    //     margin: 10,
    //     jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    // });
}

// تصدير إلى Excel
function exportToExcel(containerId, filename) {
    alert('سيتم تنفيذ تصدير Excel في الإصدار القادم');
    // يمكن استخدام مكتبة مثل SheetJS (xlsx) لتنفيذ هذه الوظيفة
    // مثال:
    // const wb = XLSX.utils.table_to_book(document.querySelector(`#${containerId} table`));
    // XLSX.writeFile(wb, `${filename}.xlsx`);
}