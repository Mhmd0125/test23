// متغيرات عامة
let currentContractor = null;
let currentPage = 'dashboard';

// التحقق من تسجيل الدخول والمقاول المختار
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    // الحصول على معرف المقاول من URL
    const urlParams = new URLSearchParams(window.location.search);
    const contractorId = urlParams.get('id');
    
    if (!contractorId) {
        window.location.href = 'contractor-selection.html';
        return false;
    }
    
    // تحميل بيانات المقاول
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    currentContractor = contractors.find(c => c.id == contractorId);
    
    if (!currentContractor) {
        alert('المقاول غير موجود');
        window.location.href = 'contractor-selection.html';
        return false;
    }
    
    return true;
}

// تهيئة الصفحة
function initPage() {
    if (!checkAuth()) return;
    
    // عرض معلومات المقاول
    displayContractorInfo();
    
    // تحميل الإحصائيات
    loadDashboardStats();
    
    // إعداد التنقل
    setupNavigation();
    
    // تحميل الجداول السريعة
    loadQuickTables();
}

// عرض معلومات المقاول
function displayContractorInfo() {
    document.getElementById('contractorName').textContent = currentContractor.name;
    document.getElementById('contractorDetails').textContent =
        `${currentContractor.phone || 'لا يوجد هاتف'} • ${currentContractor.address || 'لا يوجد عنوان'}`;
}

// تعديل المقاول الحالي
function editCurrentContractor() {
    // إنشاء نموذج تعديل المقاول
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> تعديل بيانات المقاول</h3>
                <span class="close" onclick="closeEditContractorModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editContractorForm" onsubmit="updateCurrentContractor(event)">
                    <div class="form-group">
                        <label>اسم المقاول:</label>
                        <input type="text" id="editContractorName" value="${currentContractor.name}" required>
                    </div>
                    <div class="form-group">
                        <label>رقم الهاتف:</label>
                        <input type="tel" id="editContractorPhone" value="${currentContractor.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>العنوان:</label>
                        <input type="text" id="editContractorAddress" value="${currentContractor.address || ''}">
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني:</label>
                        <input type="email" id="editContractorEmail" value="${currentContractor.email || ''}">
                    </div>
                    <div class="form-group">
                        <label>ملاحظات:</label>
                        <textarea id="editContractorNotes" rows="3">${currentContractor.notes || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ التعديلات
                        </button>
                        <button type="button" onclick="closeEditContractorModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    modal.id = 'editContractorModal';
    document.body.appendChild(modal);
}

// إغلاق نموذج تعديل المقاول
function closeEditContractorModal() {
    const modal = document.getElementById('editContractorModal');
    if (modal) {
        modal.remove();
    }
}

// تحديث بيانات المقاول الحالي
function updateCurrentContractor(event) {
    event.preventDefault();

    const updatedData = {
        name: document.getElementById('editContractorName').value.trim(),
        phone: document.getElementById('editContractorPhone').value.trim(),
        address: document.getElementById('editContractorAddress').value.trim(),
        email: document.getElementById('editContractorEmail').value.trim(),
        notes: document.getElementById('editContractorNotes').value.trim()
    };

    if (!updatedData.name) {
        alert('اسم المقاول مطلوب!');
        return;
    }

    // تحديث البيانات في localStorage
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractorIndex = contractors.findIndex(c => c.id === currentContractor.id);

    if (contractorIndex !== -1) {
        contractors[contractorIndex] = {
            ...contractors[contractorIndex],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('contractors', JSON.stringify(contractors));

        // تحديث المقاول الحالي في الذاكرة
        currentContractor = { ...contractors[contractorIndex] };

        // تحديث العرض
        displayContractorInfo();

        // إغلاق النموذج
        closeEditContractorModal();

        // رسالة نجاح
        showSuccessMessage('تم تحديث بيانات المقاول بنجاح!', 'user-edit');
    } else {
        alert('خطأ: لم يتم العثور على المقاول!');
    }
}





// تحميل إحصائيات لوحة التحكم
function loadDashboardStats() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    
    // تصفية البيانات للمقاول الحالي
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id);
    const contractorAttendance = attendance.filter(a => {
        const worker = workers.find(w => w.id === a.workerId);
        return worker && worker.contractorId === currentContractor.id;
    });
    
    // حساب الإحصائيات
    const stats = calculateStats(contractorWorkers, contractorAttendance);
    
    // عرض الإحصائيات
    document.getElementById('workersCount').textContent = contractorWorkers.length;
    document.getElementById('workDays').textContent = stats.workDays;
    document.getElementById('totalSalaries').textContent = `${stats.totalSalaries.toLocaleString()} ₪`;
    document.getElementById('overtimeHours').textContent = stats.overtimeHours;
    document.getElementById('workshopsCount').textContent = workshops.length;
    document.getElementById('subcontractorsCount').textContent = subcontractors.length;

    // حساب وعرض أكثر العمال ساعات إضافية
    const topOvertimeWorker = calculateTopOvertimeWorker(contractorWorkers, contractorAttendance);
    const topOvertimeElement = document.getElementById('topOvertimeWorker');
    if (topOvertimeElement) {
        if (topOvertimeWorker) {
            topOvertimeElement.innerHTML = `
                <div class="worker-name">${topOvertimeWorker.name}</div>
                <div class="worker-hours">${topOvertimeWorker.hours}س</div>
            `;
        } else {
            topOvertimeElement.textContent = '-';
        }
    }

    // حساب وعرض إجمالي مصاريف المعاليم
    const foremenExpensesTotal = calculateForemenExpenses();
    const foremenExpensesElement = document.getElementById('foremenExpenses');
    if (foremenExpensesElement) {
        foremenExpensesElement.textContent = `${foremenExpensesTotal.toLocaleString()} ₪`;
    }

    // حساب وعرض عدد أيام العمل
    const workingDaysCount = calculateWorkingDaysCount(contractorAttendance);
    const workingDaysElement = document.getElementById('workingDaysCount');
    if (workingDaysElement) {
        workingDaysElement.textContent = workingDaysCount;
    }
}

// حساب أكثر العمال ساعات إضافية
function calculateTopOvertimeWorker(workers, attendance) {
    if (!workers.length || !attendance.length) {
        return '-';
    }

    // حساب إجمالي الساعات الإضافية لكل عامل
    const workerOvertimeHours = {};

    attendance.forEach(record => {
        if (record.overtimeHours && record.overtimeHours > 0) {
            if (!workerOvertimeHours[record.workerId]) {
                workerOvertimeHours[record.workerId] = 0;
            }
            workerOvertimeHours[record.workerId] += record.overtimeHours;
        }
    });

    // العثور على العامل صاحب أكثر ساعات إضافية
    if (Object.keys(workerOvertimeHours).length === 0) {
        return '-';
    }

    const topOvertimeId = Object.keys(workerOvertimeHours).reduce((a, b) =>
        workerOvertimeHours[a] > workerOvertimeHours[b] ? a : b, Object.keys(workerOvertimeHours)[0]);

    const topOvertimeWorker = workers.find(w => w.id == topOvertimeId);
    if (topOvertimeWorker) {
        const totalHours = workerOvertimeHours[topOvertimeId];
        return {
            name: topOvertimeWorker.name,
            hours: totalHours.toFixed(1)
        };
    }

    return null;
}

// حساب إجمالي مصاريف المعاليم
function calculateForemenExpenses() {
    const foremanExpenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];

    // تصفية المصاريف للمقاول الحالي
    const contractorExpenses = foremanExpenses.filter(expense =>
        expense.contractorId === currentContractor.id
    );

    // حساب الإجمالي
    const total = contractorExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    return total;
}

// حساب عدد أيام العمل (عدد الأيام المختلفة التي تم العمل فيها)
function calculateWorkingDaysCount(attendance) {
    if (!attendance.length) {
        return 0;
    }

    // الحصول على التواريخ الفريدة التي تم العمل فيها
    const uniqueDates = new Set();

    attendance.forEach(record => {
        if (record.status === 'present') {
            uniqueDates.add(record.date);
        }
    });

    return uniqueDates.size;
}

// تحميل جدول التكاليف الإضافية
function loadAdditionalCostsTable() {
    const additionalCosts = JSON.parse(localStorage.getItem('additionalCosts')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const tableBody = document.getElementById('additionalCostsTableBody');
    const totalElement = document.getElementById('totalAdditionalCosts');

    if (!tableBody) return;

    // تصفية التكاليف للمقاول الحالي
    const contractorCosts = additionalCosts.filter(cost =>
        cost.contractorId === currentContractor.id
    );

    // ترتيب حسب التاريخ (الأحدث أولاً)
    contractorCosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = '';

    contractorCosts.forEach(cost => {
        const workshop = workshops.find(w => w.id == cost.workshopId);
        const subcontractor = subcontractors.find(s => s.id == cost.subcontractorId);
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${new Date(cost.date).toLocaleDateString('ar')}</td>
            <td>${subcontractor ? subcontractor.name : 'غير محدد'}</td>
            <td>${cost.description}</td>
            <td>${parseFloat(cost.amount).toLocaleString()} ₪</td>
            <td>${workshop ? workshop.name : 'غير محدد'}</td>
            <td>${cost.notes || '-'}</td>
            <td>
                <button class="btn tiny" onclick="editAdditionalCost(${cost.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn tiny danger" onclick="deleteAdditionalCost(${cost.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // حساب الإجمالي
    const total = contractorCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
    if (totalElement) {
        totalElement.textContent = `${total.toLocaleString()} ₪`;
    }

    if (contractorCosts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>لا توجد تكاليف إضافية مضافة
                </td>
            </tr>
        `;
    }
}

// إظهار نموذج إضافة تكلفة إضافية
function showAddCostModal() {
    document.getElementById('addCostModal').style.display = 'block';
    loadCostSubcontractorsDropdown();
    loadCostWorkshopsDropdown();
    document.getElementById('costDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('costDescription').focus();
}

// إخفاء نموذج إضافة تكلفة إضافية
function hideAddCostModal() {
    document.getElementById('addCostModal').style.display = 'none';
    document.getElementById('addCostForm').reset();
}

// تحميل مقاولين الباطن في قائمة التكاليف
function loadCostSubcontractorsDropdown() {
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const select = document.getElementById('costSubcontractor');

    if (select) {
        select.innerHTML = '<option value="">اختر مقاول الباطن</option>';

        // تصفية مقاولين الباطن للمقاول الحالي والنشطين فقط
        const contractorSubcontractors = subcontractors.filter(s =>
            s.contractorId === currentContractor.id && s.active
        );

        contractorSubcontractors.forEach(subcontractor => {
            const option = document.createElement('option');
            option.value = subcontractor.id;
            option.textContent = subcontractor.name;
            select.appendChild(option);
        });
    }
}

// تحميل الورش في قائمة التكاليف
function loadCostWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const select = document.getElementById('costWorkshop');

    if (select) {
        select.innerHTML = '<option value="">اختر الورشة</option>';
        workshops.forEach(workshop => {
            const option = document.createElement('option');
            option.value = workshop.id;
            option.textContent = workshop.name;
            select.appendChild(option);
        });
    }
}

// تحديث جدول التكاليف الإضافية
function refreshAdditionalCostsTable() {
    loadAdditionalCostsTable();
}

// إعداد نماذج التكاليف الإضافية
function setupAdditionalCostsForms() {
    const costForm = document.getElementById('addCostForm');

    if (costForm) {
        costForm.addEventListener('submit', handleAdditionalCostSubmit);
    }

    // إغلاق النماذج عند النقر خارجها
    window.addEventListener('click', function(e) {
        const costModal = document.getElementById('addCostModal');

        if (e.target === costModal) {
            hideAddCostModal();
        }
    });
}

// معالجة إرسال نموذج التكلفة الإضافية
function handleAdditionalCostSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        date: document.getElementById('costDate').value,
        subcontractorId: parseInt(document.getElementById('costSubcontractor').value),
        description: document.getElementById('costDescription').value.trim(),
        amount: parseFloat(document.getElementById('costAmount').value),
        workshopId: document.getElementById('costWorkshop').value || null,
        notes: document.getElementById('costNotes').value.trim()
    };

    if (!formData.date || !formData.subcontractorId || !formData.description || !formData.amount) {
        alert('الرجاء ملء جميع الحقول المطلوبة (التاريخ، مقاول الباطن، الوصف، المبلغ)');
        return;
    }

    let additionalCosts = JSON.parse(localStorage.getItem('additionalCosts')) || [];

    if (editingId) {
        // تعديل تكلفة موجودة
        const costIndex = additionalCosts.findIndex(c => c.id == editingId);
        if (costIndex !== -1) {
            additionalCosts[costIndex] = {
                ...additionalCosts[costIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التكلفة';

        showSuccessMessage('تم تحديث التكلفة الإضافية بنجاح!', 'edit');
    } else {
        // إضافة تكلفة جديدة
        const newId = additionalCosts.length > 0 ? Math.max(...additionalCosts.map(c => c.id)) + 1 : 1;

        const newCost = {
            id: newId,
            contractorId: currentContractor.id,
            contractorName: currentContractor.name,
            ...formData,
            createdAt: new Date().toISOString()
        };

        additionalCosts.push(newCost);
        showSuccessMessage('تم إضافة التكلفة الإضافية بنجاح!', 'plus');
    }

    localStorage.setItem('additionalCosts', JSON.stringify(additionalCosts));

    // إخفاء النموذج
    hideAddCostModal();

    // تحديث الجدول
    loadAdditionalCostsTable();

    // تحديث لوحة التحكم
    loadDashboardStats();
}

// حذف تكلفة إضافية
function deleteAdditionalCost(costId) {
    if (confirm('هل أنت متأكد من حذف هذه التكلفة؟')) {
        let additionalCosts = JSON.parse(localStorage.getItem('additionalCosts')) || [];
        additionalCosts = additionalCosts.filter(cost => cost.id !== costId);
        localStorage.setItem('additionalCosts', JSON.stringify(additionalCosts));

        // تحديث الجدول
        loadAdditionalCostsTable();

        // تحديث لوحة التحكم
        loadDashboardStats();

        alert('تم حذف التكلفة بنجاح!');
    }
}

// تعديل تكلفة إضافية
function editAdditionalCost(costId) {
    const additionalCosts = JSON.parse(localStorage.getItem('additionalCosts')) || [];
    const cost = additionalCosts.find(c => c.id === costId);

    if (cost) {
        // ملء النموذج ببيانات التكلفة
        document.getElementById('costDate').value = cost.date;
        document.getElementById('costSubcontractor').value = cost.subcontractorId || '';
        document.getElementById('costDescription').value = cost.description;
        document.getElementById('costAmount').value = cost.amount;
        document.getElementById('costWorkshop').value = cost.workshopId || '';
        document.getElementById('costNotes').value = cost.notes || '';

        // فتح النموذج
        showAddCostModal();

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addCostForm');
        form.setAttribute('data-editing', costId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث التكلفة';
    }
}

// حساب الإحصائيات
function calculateStats(workers, attendance) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // تصفية حضور الشهر الحالي
    const monthlyAttendance = attendance.filter(a => {
        const date = new Date(a.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // حساب أيام العمل
    const workDays = monthlyAttendance.length;
    
    // حساب مجموع الرواتب (صافي اليومية)
    const totalSalaries = monthlyAttendance.reduce((sum, a) => {
        const worker = workers.find(w => w.id === a.workerId);
        if (worker) {
            // حساب صافي اليومية باستخدام نفس الدالة المستخدمة في التقارير
            const netDaily = calculateNetDaily(
                a.dailyWage || worker.dailyWage || 0,
                a.workDay || 0,
                a.overtimeHours || 0,
                a.overtimeRate || worker.overtimeRate || 0,
                a.advance || 0,
                a.smokingCosts || 0
            );
            return sum + netDaily;
        }
        return sum;
    }, 0);
    
    // حساب الساعات الإضافية
    const overtimeHours = monthlyAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    
    return {
        workDays,
        totalSalaries,
        overtimeHours
    };
}

// تحميل الجداول السريعة
function loadQuickTables() {
    loadActiveWorkersTable();
    loadTodayAttendanceTable();
}

// تحميل جدول العمال النشطين
function loadActiveWorkersTable() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);
    const tableBody = document.getElementById('activeWorkersTable');
    
    tableBody.innerHTML = '';
    
    contractorWorkers.slice(0, 5).forEach(worker => {
        // البحث عن آخر حضور
        const lastAttendance = attendance
            .filter(a => a.workerId === worker.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const workshop = workshops.find(w => w.id === worker.workshopId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${worker.name}</td>
            <td>${workshop ? workshop.name : 'غير محدد'}</td>
            <td>${worker.dailyWage || 0} ₪</td>
            <td>${lastAttendance ? new Date(lastAttendance.date).toLocaleDateString('ar') : 'لا يوجد'}</td>
        `;
        tableBody.appendChild(row);
    });
    
    if (contractorWorkers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا يوجد عمال نشطين</td></tr>';
    }
}

// تحميل جدول حضور اليوم
function loadTodayAttendanceTable() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    
    const contractorTodayAttendance = todayAttendance.filter(a => {
        const worker = workers.find(w => w.id === a.workerId);
        return worker && worker.contractorId === currentContractor.id;
    });
    
    const tableBody = document.getElementById('todayAttendanceTable');
    tableBody.innerHTML = '';
    
    contractorTodayAttendance.forEach(record => {
        const worker = workers.find(w => w.id === record.workerId);
        const workshop = workshops.find(w => w.id === record.workshopId);
        
        if (worker) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${worker.name}</td>
                <td>${workshop ? workshop.name : 'غير محدد'}</td>
                <td>${record.workHours || 8}</td>
                <td>${record.overtimeHours || 0}</td>
            `;
            tableBody.appendChild(row);
        }
    });
    
    if (contractorTodayAttendance.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا يوجد حضور مسجل اليوم</td></tr>';
    }
}

// إعداد التنقل
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

// التنقل بين الصفحات
function navigateToPage(page) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إزالة الفئة النشطة من جميع عناصر التنقل
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const pageContent = document.getElementById(`${page}Content`);
    if (pageContent) {
        pageContent.classList.add('active');
    }
    
    // تفعيل عنصر التنقل
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // تحديث عنوان الصفحة
    updatePageTitle(page);
    
    // تحميل محتوى الصفحة
    loadPageContent(page);
    
    currentPage = page;
}

// تحديث عنوان الصفحة
function updatePageTitle(page) {
    const titles = {
        'dashboard': 'لوحة التحكم',
        'workers': 'إدارة العمال',
        'attendance': 'تسجيل اليوميات',
        'workshops': 'إدارة الورش',
        'subcontractors': 'مقاولين الباطن',
        'foremen-accounts': 'حسابات المعاليم',
        'reports': 'التقارير'
    };
    
    const descriptions = {
        'dashboard': 'نظرة عامة على إحصائيات المقاول',
        'workers': 'إدارة وتتبع العمال',
        'attendance': 'تسجيل حضور وغياب العمال',
        'workshops': 'إدارة الورش والمواقع',
        'subcontractors': 'إدارة مقاولين الباطن',
        'foremen-accounts': 'حسابات ومصاريف المعاليم',
        'reports': 'تقارير وإحصائيات مفصلة'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'صفحة غير معروفة';
    document.getElementById('pageDescription').textContent = descriptions[page] || '';
}

// تحميل محتوى الصفحة
function loadPageContent(page) {
    if (page === 'dashboard') {
        loadDashboardStats();
        loadQuickTables();
    } else if (page === 'workers') {
        loadWorkersPage();
    } else if (page === 'attendance') {
        loadAttendancePage();
    } else if (page === 'subcontractors') {
        loadSubcontractorsPage();
    } else if (page === 'fixed-salary') {
        loadFixedSalaryPage();
    } else if (page === 'workshops') {
        loadWorkshopsPage();
    } else if (page === 'foremen-accounts') {
        loadForemenAccountsPage();
    } else if (page === 'reports') {
        loadReportsPage();
    } else {
        // سيتم تحميل محتوى الصفحات الأخرى لاحقاً
        const pageContent = document.getElementById(`${page}Content`);
        if (pageContent && !pageContent.innerHTML.trim()) {
            pageContent.innerHTML = `
                <div class="coming-soon">
                    <i class="fas fa-tools"></i>
                    <h3>قيد التطوير</h3>
                    <p>هذه الصفحة قيد التطوير وستكون متاحة قريباً</p>
                </div>
            `;
        }
    }
}

// تحديث البيانات
function refreshData() {
    if (currentPage === 'dashboard') {
        loadDashboardStats();
        loadQuickTables();
    } else {
        loadPageContent(currentPage);
    }
    
    // إظهار رسالة تأكيد
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> تم التحديث';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
}

// تغيير المقاول
function changeContractor() {
    if (confirm('هل تريد العودة لصفحة اختيار المقاول؟')) {
        window.location.href = 'contractor-selection.html';
    }
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedContractor');
        window.location.href = 'login.html';
    }
}

// تحميل صفحة العمال
function loadWorkersPage() {
    const pageContent = document.getElementById('workersContent');

    pageContent.innerHTML = `
        <div class="workers-page-full">
            <!-- رأس الصفحة -->
            <div class="workers-header">
                <div class="workers-title">
                    <h2><i class="fas fa-users"></i> إدارة العمال</h2>
                    <p>عرض وإدارة جميع العمال</p>
                </div>
                <div class="workers-actions">
                    <button class="btn success" onclick="showAddWorkerModal()">
                        <i class="fas fa-user-plus"></i> إضافة عامل جديد
                    </button>
                    <div class="card-size-controls">
                        <label>حجم البطاقات:</label>
                        <button class="btn small" onclick="decreaseCardSize()" title="تصغير البطاقات">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn small" onclick="increaseCardSize()" title="تكبير البطاقات">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                    <button class="btn info" id="viewToggleBtn" onclick="toggleWorkersView()">
                        <i class="fas fa-table"></i> عرض كجدول
                    </button>
                    <button class="btn warning" onclick="showArchivedWorkers()">
                        <i class="fas fa-archive"></i> الأرشيف
                    </button>
                    <button class="btn" onclick="printWorkersList()">
                        <i class="fas fa-print"></i> طباعة قائمة العمال
                    </button>
                </div>
            </div>

            <!-- عرض البطاقات مع تمرير منفصل -->
            <div id="workersCardsView" class="workers-cards-container-scrollable">
                <div class="workers-cards-grid" id="workersCards">
                    <!-- سيتم ملؤها من JavaScript -->
                </div>
            </div>

            <!-- عرض الجدول -->
            <div id="workersTableView" class="workers-table-section-full" style="display: none;">
                <div class="card">
                    <div class="table-container">
                        <table class="data-table workers-full-table">
                            <thead>
                                <tr>
                                    <th style="width: 15%;">الاسم</th>
                                    <th style="width: 12%;">رقم التشغيل</th>
                                    <th style="width: 15%;">الورشة</th>
                                    <th style="width: 12%;">اليومية</th>
                                    <th style="width: 12%;">سعر الساعة الإضافية</th>
                                    <th style="width: 12%;">الهاتف</th>
                                    <th style="width: 10%;">الحالة</th>
                                    <th style="width: 12%;">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="workersTableBody">
                                <!-- سيتم ملؤها من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- نموذج إضافة عامل منبثق -->
        <div id="addWorkerModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> إضافة عامل جديد</h3>
                    <span class="close" onclick="hideAddWorkerModal()">&times;</span>
                </div>
                <form id="addWorkerForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workerName">اسم العامل</label>
                            <input type="text" id="workerName" required>
                        </div>
                        <div class="form-group">
                            <label for="workerWorkshop">الورشة</label>
                            <select id="workerWorkshop">
                                <option value="">اختر الورشة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workerNumber">رقم التشغيل</label>
                            <input type="text" id="workerNumber" placeholder="اختياري - يمكن تركه فارغ">
                            <small class="form-help">يمكن أن يكون مكرر أو فارغ</small>
                        </div>
                        <div class="form-group">
                            <label for="dailyWage">اليومية (شيكل)</label>
                            <input type="number" id="dailyWage" min="0" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="overtimeRate">سعر الساعة الإضافية (شيكل)</label>
                            <input type="number" id="overtimeRate" min="0" step="0.01" readonly>
                            <small class="form-help">يتم حسابه تلقائياً (اليومية ÷ 8)</small>
                        </div>
                        <div class="form-group">
                            <label for="workerPhone">رقم الهاتف</label>
                            <input type="tel" id="workerPhone">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="workerNotes">ملاحظات</label>
                        <textarea id="workerNotes" rows="2"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ العامل
                        </button>
                        <button type="button" onclick="hideAddWorkerModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // تحميل الورش في القائمة المنسدلة
    loadWorkshopsDropdown();

    // تحميل جدول العمال
    loadWorkersTable();

    // إعداد النموذج
    setupWorkerForm();

    // تحميل حجم البطاقات المحفوظ
    setTimeout(() => {
        loadSavedCardSize();
    }, 100);
}

// تحميل الورش في القائمة المنسدلة
function loadWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const select = document.getElementById('workerWorkshop');

    if (select) {
        select.innerHTML = '<option value="">اختر الورشة</option>';
        workshops.forEach(workshop => {
            const option = document.createElement('option');
            option.value = workshop.id;
            option.textContent = workshop.name;
            select.appendChild(option);
        });
    }
}

// تحميل العمال (بطاقات وجدول)
function loadWorkersTable() {
    loadWorkersCards();
    loadWorkersTableData();
}

// تحميل بطاقات العمال
function loadWorkersCards() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const cardsContainer = document.getElementById('workersCards');

    if (!cardsContainer) return;

    // تصفية العمال للمقاول الحالي (غير المؤرشفين فقط)
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && !w.archived);

    cardsContainer.innerHTML = '';

    contractorWorkers.forEach(worker => {
        const workshop = workshops.find(w => w.id === worker.workshopId);

        // البحث عن عمال آخرين بنفس رقم التشغيل
        const duplicateWorkers = contractorWorkers.filter(w =>
            w.number && w.number === worker.number && w.id !== worker.id
        );

        const card = document.createElement('div');
        card.className = `worker-card ${!worker.active ? 'worker-inactive' : ''}`;
        card.setAttribute('data-worker-id', worker.id);

        // إضافة كلاس للعامل الجديد
        if (worker.isNew) {
            card.classList.add('new-worker-card');
            // إزالة الكلاس بعد 3 ثواني
            setTimeout(() => {
                card.classList.remove('new-worker-card');
                // إزالة العلامة من البيانات
                worker.isNew = false;
                localStorage.setItem('workers', JSON.stringify(workers));
            }, 3000);
        }

        // لا نضيف class للبطاقة - فقط للنص

        card.innerHTML = `
            <div class="worker-card-header">
                <div class="worker-name-display">
                    <h3>${worker.name}</h3>
                </div>
                <div class="worker-status">
                    <div class="status-circle ${worker.active ? 'active' : 'inactive'}"
                         onclick="toggleWorkerStatus(${worker.id})"
                         title="${worker.active ? 'نشط - اضغط للإيقاف' : 'غير نشط - اضغط للتفعيل'}">
                    </div>
                </div>
            </div>
            <div class="worker-card-body">
                <div class="worker-number-section">
                    ${worker.number ?
                        `<p class="worker-number">
                            #${worker.number}
                            ${duplicateWorkers.length > 0 ?
                                `<span class="duplicate-text">مكرر مع ${duplicateWorkers.map(w => w.name).join(', ')}</span>`
                                : ''
                            }
                         </p>`
                        : '<p class="no-number">بدون رقم تشغيل</p>'
                    }
                </div>
                <div class="worker-details">
                    <div class="detail-item">
                        <i class="fas fa-building"></i>
                        <span>${workshop ? workshop.name : 'غير محدد'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${worker.dailyWage} ₪/يوم</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${worker.overtimeRate} ₪/ساعة</span>
                    </div>
                    ${worker.phone ? `
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${worker.phone}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="worker-card-actions">
                <button class="btn small" onclick="editWorker(${worker.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small ${worker.active ? 'warning' : 'success'}"
                        onclick="toggleWorkerStatus(${worker.id})"
                        title="${worker.active ? 'إيقاف' : 'تفعيل'}">
                    <i class="fas fa-${worker.active ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn small danger" onclick="archiveWorker(${worker.id})" title="أرشفة العامل">
                    <i class="fas fa-archive"></i>
                </button>
            </div>
        `;

        cardsContainer.appendChild(card);
    });

    if (contractorWorkers.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-workers-message">
                <i class="fas fa-users" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h3>لا يوجد عمال مضافين</h3>
                <p>ابدأ بإضافة عامل جديد لهذا المقاول</p>
                <button class="btn success" onclick="showAddWorkerModal()">
                    <i class="fas fa-user-plus"></i> إضافة عامل جديد
                </button>
            </div>
        `;
    }
}

// تحميل جدول العمال
function loadWorkersTableData() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const tableBody = document.getElementById('workersTableBody');

    if (!tableBody) return;

    // تصفية العمال للمقاول الحالي (العمال النشطين فقط)
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active !== false && !w.archived);

    tableBody.innerHTML = '';

    contractorWorkers.forEach(worker => {
        const workshop = workshops.find(w => w.id === worker.workshopId);

        const row = document.createElement('tr');

        // إضافة كلاس للعامل الجديد
        if (worker.isNew) {
            row.classList.add('new-worker');
            // إزالة الكلاس بعد 3 ثواني
            setTimeout(() => {
                row.classList.remove('new-worker');
            }, 3000);
        }

        row.innerHTML = `
            <td>${worker.name}</td>
            <td>${worker.number}</td>
            <td>${workshop ? workshop.name : 'غير محدد'}</td>
            <td>${worker.dailyWage} ₪</td>
            <td>${worker.overtimeRate} ₪</td>
            <td>${worker.phone || '-'}</td>
            <td>
                <span class="status-badge ${worker.active ? 'active' : 'inactive'}">
                    ${worker.active ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>
                <button class="btn small" onclick="editWorker(${worker.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small ${worker.active ? 'warning' : 'success'}"
                        onclick="toggleWorkerStatus(${worker.id})"
                        title="${worker.active ? 'إيقاف' : 'تفعيل'}">
                    <i class="fas fa-${worker.active ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn small danger" onclick="archiveWorker(${worker.id})" title="أرشفة العامل">
                    <i class="fas fa-archive"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    if (contractorWorkers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>لا يوجد عمال مضافين لهذا المقاول
                </td>
            </tr>
        `;
    }
}

// إظهار نموذج إضافة عامل
function showAddWorkerModal() {
    document.getElementById('addWorkerModal').style.display = 'block';
    loadWorkshopsDropdown();
    document.getElementById('workerName').focus();
}

// إخفاء نموذج إضافة عامل
function hideAddWorkerModal() {
    document.getElementById('addWorkerModal').style.display = 'none';
    const form = document.getElementById('addWorkerForm');
    form.reset();

    // إزالة وضع التعديل
    form.removeAttribute('data-editing');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العامل';
}

// إعداد نموذج العامل
function setupWorkerForm() {
    const form = document.getElementById('addWorkerForm');
    const dailyWageInput = document.getElementById('dailyWage');
    const overtimeRateInput = document.getElementById('overtimeRate');

    // حساب سعر الساعة الإضافية تلقائياً
    if (dailyWageInput && overtimeRateInput) {
        dailyWageInput.addEventListener('input', function() {
            const dailyWage = parseFloat(this.value) || 0;
            const overtimeRate = (dailyWage / 8).toFixed(2);
            overtimeRateInput.value = overtimeRate;
        });
    }

    // معالجة إرسال النموذج
    if (form) {
        form.addEventListener('submit', handleWorkerSubmit);
    }

    // إغلاق النموذج عند النقر خارجه
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('addWorkerModal');
        if (e.target === modal) {
            hideAddWorkerModal();
        }
    });
}

// معالجة إرسال نموذج العامل
function handleWorkerSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        name: document.getElementById('workerName').value.trim(),
        workshopId: document.getElementById('workerWorkshop').value || null,
        number: document.getElementById('workerNumber').value.trim(),
        dailyWage: parseFloat(document.getElementById('dailyWage').value) || 0,
        overtimeRate: parseFloat(document.getElementById('overtimeRate').value) || 0,
        phone: document.getElementById('workerPhone').value.trim(),
        notes: document.getElementById('workerNotes').value.trim()
    };

    if (!formData.name || !formData.dailyWage) {
        alert('الرجاء ملء الاسم واليومية على الأقل');
        return;
    }

    let workers = JSON.parse(localStorage.getItem('workers')) || [];

    // السماح بالأرقام المكررة أو الفارغة - لا نتحقق من التكرار

    if (editingId) {
        // تعديل عامل موجود
        const workerIndex = workers.findIndex(w => w.id == editingId);
        if (workerIndex !== -1) {
            workers[workerIndex] = {
                ...workers[workerIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العامل';

        showSuccessMessage('تم تحديث بيانات العامل بنجاح!', 'user-edit');
    } else {
        // إضافة عامل جديد
        const newId = workers.length > 0 ? Math.max(...workers.map(w => w.id)) + 1 : 1;

        const newWorker = {
            id: newId,
            contractorId: currentContractor.id,
            contractorName: currentContractor.name,
            ...formData,
            active: true,
            isNew: true,
            createdAt: new Date().toISOString()
        };

        workers.push(newWorker);
        showSuccessMessage('تم إضافة العامل بنجاح!', 'user-plus');
    }

    localStorage.setItem('workers', JSON.stringify(workers));

    // إخفاء النموذج
    hideAddWorkerModal();

    // تحديث الجدول
    loadWorkersTable();

    // تحديث الإحصائيات في لوحة التحكم
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

// تبديل عرض العمال (بطاقات/جدول)
function toggleWorkersView() {
    const cardsView = document.getElementById('workersCardsView');
    const tableView = document.getElementById('workersTableView');
    const toggleBtn = document.getElementById('viewToggleBtn');

    if (cardsView.style.display === 'none') {
        // عرض البطاقات
        cardsView.style.display = 'block';
        tableView.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-table"></i> عرض كجدول';
    } else {
        // عرض الجدول
        cardsView.style.display = 'none';
        tableView.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-th"></i> عرض كبطاقات';
    }
}

// طباعة قائمة العمال
function printWorkersList() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id);

    let printContent = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <h2>قائمة العمال</h2>
            <p>المقاول: ${currentContractor.name}</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar')}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #f5f5f5;">
                    <th style="border: 1px solid #ddd; padding: 8px;">الاسم</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">رقم التشغيل</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">الورشة</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">اليومية</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">سعر الساعة الإضافية</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">الهاتف</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    contractorWorkers.forEach(worker => {
        const workshop = workshops.find(w => w.id === worker.workshopId);
        printContent += `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.number}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${workshop ? workshop.name : 'غير محدد'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.dailyWage} ₪</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.overtimeRate} ₪</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.phone || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${worker.active ? 'نشط' : 'غير نشط'}</td>
            </tr>
        `;
    });

    printContent += `
            </tbody>
        </table>
        <div style="margin-top: 2rem; text-align: center;">
            <p><strong>إجمالي العمال: ${contractorWorkers.length}</strong></p>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>قائمة العمال</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// تعديل عامل
function editWorker(workerId) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const worker = workers.find(w => w.id === workerId);

    if (worker) {
        // ملء النموذج ببيانات العامل
        document.getElementById('workerName').value = worker.name;
        document.getElementById('workerNumber').value = worker.number;
        document.getElementById('workerPhone').value = worker.phone || '';
        document.getElementById('workerWorkshop').value = worker.workshopId || '';
        document.getElementById('dailyWage').value = worker.dailyWage;
        document.getElementById('overtimeRate').value = worker.overtimeRate;
        document.getElementById('workerNotes').value = worker.notes || '';

        // فتح النموذج
        showAddWorkerModal();

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addWorkerForm');
        form.setAttribute('data-editing', workerId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث العامل';
    }
}

// تبديل حالة العامل (نشط/غير نشط) - محذوفة لتجنب التكرار

// تحديث جدول العمال
function refreshWorkersTable() {
    loadWorkersTable();
}

// تعديل عامل
function editWorker(workerId) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const worker = workers.find(w => w.id === workerId);

    if (worker) {
        // ملء النموذج ببيانات العامل
        document.getElementById('workerName').value = worker.name;
        document.getElementById('workerWorkshop').value = worker.workshopId || '';
        document.getElementById('workerNumber').value = worker.number;
        document.getElementById('dailyWage').value = worker.dailyWage;
        document.getElementById('overtimeRate').value = worker.overtimeRate;
        document.getElementById('workerPhone').value = worker.phone || '';
        document.getElementById('workerNotes').value = worker.notes || '';

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addWorkerForm');
        form.setAttribute('data-editing', workerId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث العامل';

        const cancelBtn = document.getElementById('cancelWorkerEdit');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
            cancelBtn.onclick = cancelWorkerEdit;
        }

        // إظهار النموذج
        showAddWorkerModal();
    }
}

// إلغاء تعديل العامل
function cancelWorkerEdit() {
    const form = document.getElementById('addWorkerForm');
    form.removeAttribute('data-editing');
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العامل';

    const cancelBtn = document.getElementById('cancelWorkerEdit');
    cancelBtn.style.display = 'none';
}

// تبديل حالة العامل (نشط/غير نشط)
function toggleWorkerStatus(workerId) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerIndex = workers.findIndex(w => w.id === workerId);

    if (workerIndex !== -1) {
        const worker = workers[workerIndex];
        const newStatus = !worker.active;

        // تحديث البيانات
        workers[workerIndex].active = newStatus;
        localStorage.setItem('workers', JSON.stringify(workers));

        // تحديث البطاقة فوراً بدون إعادة تحميل
        const card = document.querySelector(`[data-worker-id="${workerId}"]`);
        if (card) {
            // تحديث الدائرة
            const statusCircle = card.querySelector('.status-circle');
            if (statusCircle) {
                statusCircle.classList.remove('active', 'inactive');
                statusCircle.classList.add(newStatus ? 'active' : 'inactive');
                statusCircle.title = newStatus ? 'نشط - اضغط للإيقاف' : 'غير نشط - اضغط للتفعيل';
            }

            // تحديث لون البطاقة
            if (newStatus) {
                card.classList.remove('worker-inactive');
            } else {
                card.classList.add('worker-inactive');
            }
        }
    }
}

// تحميل صفحة تسجيل اليوميات
function loadAttendancePage() {
    const pageContent = document.getElementById('attendanceContent');

    pageContent.innerHTML = `
        <div class="attendance-page-grid">
            <!-- شريط التاريخ المضغوط مع الإحصائيات -->
            <div class="compact-date-bar">
                <input type="date" id="attendanceDate" value="${new Date().toISOString().split('T')[0]}" onchange="loadAttendanceForDate()">

                <!-- إحصائيات العمال -->
                <div class="attendance-stats">
                    <span class="stat-item">العمال: <span id="totalWorkers">0</span></span>
                    <span class="stat-item">الحاضرين: <span id="presentWorkers">0</span></span>
                    <span class="stat-item">الغائبين: <span id="absentWorkers">0</span></span>
                    <span class="stat-item">إجمالي السلف: <span id="totalAdvances">0.00 ₪</span></span>
                    <span class="stat-item">إجمالي الدخان: <span id="totalSmokingCosts">0.00 ₪</span></span>
                    <span class="stat-item">إجمالي صافي اليومية: <span id="totalNetDaily">0.00 ₪</span></span>
                </div>

                <div class="attendance-controls">
                    <div class="attendance-card-size-controls">
                        <label>حجم البطاقات:</label>
                        <button class="btn small" onclick="decreaseAttendanceCardSize()" title="تصغير البطاقات">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn small" onclick="increaseAttendanceCardSize()" title="تكبير البطاقات">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                    <button class="btn small success" onclick="saveAllAttendance()">
                        <i class="fas fa-save"></i> حفظ الكل
                    </button>
                </div>
            </div>

            <!-- Grid بطاقات تسجيل اليوميات -->
            <div class="attendance-cards-container">
                <div class="attendance-cards-grid" id="attendanceCardsGrid">
                    <!-- سيتم ملؤها من JavaScript -->
                </div>
            </div>
        </div>
    `;

    // تحميل بيانات اليومية للتاريخ الحالي
    loadAttendanceForDate();

    // تحميل حجم بطاقات اليوميات المحفوظ
    setTimeout(() => {
        loadSavedAttendanceCardSize();
    }, 100);
}

// تحميل بيانات اليومية لتاريخ محدد
function loadAttendanceForDate() {
    console.log('🔄 تحميل الحضور للتاريخ المحدد...');
    const selectedDate = document.getElementById('attendanceDate').value;
    console.log('📅 التاريخ المحدد:', selectedDate);
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    
    console.log('👥 عدد العمال الكلي:', workers.length);
    console.log('📊 سجلات الحضور الكلية:', attendance.length);

    // تصفية العمال للمقاول الحالي والنشطين وغير المؤرشفين فقط
    const contractorWorkers = workers.filter(w =>
        w.contractorId === currentContractor.id && w.active && !w.archived
    );
    
    console.log('🏗️ المقاول الحالي:', currentContractor.id, currentContractor.name);
    console.log('👷 عمال المقاول المفلترين:', contractorWorkers.length);

    // البحث عن سجلات الحضور للتاريخ المحدد
    const dateAttendance = attendance.filter(a => a.date === selectedDate);

    const attendanceCardsGrid = document.getElementById('attendanceCardsGrid');
    if (!attendanceCardsGrid) return;

    attendanceCardsGrid.innerHTML = '';

    let presentCount = 0;
    let absentCount = 0;
    let totalAdvances = 0;
    let totalSmokingCosts = 0;
    let totalNetDaily = 0;

    contractorWorkers.forEach(worker => {
        const workshop = workshops.find(w => w.id === worker.workshopId);
        const existingRecord = dateAttendance.find(a => a.workerId === worker.id);

        const isPresent = existingRecord ? existingRecord.status === 'present' : false;
        const isAbsent = existingRecord ? existingRecord.status === 'absent' : false;
        const isSaved = existingRecord && existingRecord.saved;
        const dailyWage = existingRecord ? existingRecord.dailyWage || worker.dailyWage : worker.dailyWage;
        const workDay = existingRecord ? existingRecord.workDay || 1 : 1;
        const overtimeHours = existingRecord ? existingRecord.overtimeHours || 0 : 0;
        const overtimeRate = existingRecord ? existingRecord.overtimeRate || worker.overtimeRate : worker.overtimeRate;
        const advance = existingRecord ? existingRecord.advance || 0 : 0;
        const smokingCosts = existingRecord ? existingRecord.smokingCosts || 0 : 0;

        // حساب صافي اليومية حسب الحالة
        let netDaily;
        if (isPresent) {
            // العامل حاضر: حساب عادي
            netDaily = calculateNetDaily(dailyWage, workDay, overtimeHours, overtimeRate, advance, smokingCosts);
        } else {
            // العامل غائب: صفر إلا إذا كان فيه تكاليف
            if (advance > 0 || smokingCosts > 0) {
                netDaily = -(advance + smokingCosts);
            } else {
                netDaily = 0;
            }
        }

        if (isPresent) presentCount++;
        else absentCount++;

        // إضافة للإحصائيات
        totalAdvances += advance;
        totalSmokingCosts += smokingCosts;
        totalNetDaily += netDaily;

        const card = document.createElement('div');
        // تحديد classes البطاقة
        let cardClasses = `worker-grid-card ${isPresent ? 'present' : 'absent'}`;

        // إضافة class saved إذا كان العامل له سجل محفوظ
        if (existingRecord) {
            cardClasses += ' saved';
        }

        card.className = cardClasses;
        card.setAttribute('data-worker-id', worker.id);

        card.innerHTML = `
            <div class="worker-card-header">
                <div class="status-indicator ${isPresent ? 'present' : 'absent'}" id="statusIndicator-${worker.id}">
                    ${isPresent ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                </div>
                <div class="worker-info-centered">
                    <h3 class="worker-name-large">${worker.name}</h3>
                    <span class="worker-number">#${worker.number}</span>
                </div>
                <div class="header-spacer"></div>
            </div>

            <div class="worker-card-body">
                <div class="quick-fields">
                    <div class="field-row">
                        <label>الحالة:</label>
                        <select class="status-select" id="status-${worker.id}"
                                ${isSaved ? 'disabled' : ''}
                                onchange="updateWorkerStatus(${worker.id}, this.value)">
                            <option value="absent" ${!isPresent ? 'selected' : ''}>غائب</option>
                            <option value="present" ${isPresent ? 'selected' : ''}>حاضر</option>
                        </select>
                    </div>

                    <div class="field-row">
                        <label>الورشة:</label>
                        <select class="field-input-small" id="workshop-${worker.id}"
                                ${isSaved ? 'disabled' : ''}
                                onchange="updateWorkerField(${worker.id})">
                            <option value="">اختر الورشة</option>
                            ${workshops.map(w => `<option value="${w.id}" ${(existingRecord?.workshopId || worker.workshopId) == w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="field-row">
                        <label>اليومية:</label>
                        <input type="number" class="field-input-small" id="dailyWage-${worker.id}"
                               value="${dailyWage}" min="0" step="1" maxlength="4"
                               ${!isPresent || isSaved ? 'disabled readonly' : ''}
                               onchange="updateOvertimeRate(${worker.id}); updateWorkerField(${worker.id})"
                               oninput="updateOvertimeRate(${worker.id})">
                    </div>

                    <div class="field-row">
                        <label>يوم عمل:</label>
                        <input type="number" class="field-input-small" id="workDay-${worker.id}"
                               value="${workDay}" min="0" max="1" step="0.5" maxlength="3"
                               ${!isPresent || isSaved ? 'disabled readonly' : ''}
                               onchange="updateWorkerField(${worker.id})">
                    </div>

                    <div class="field-row">
                        <label>ساعات إضافية:</label>
                        <input type="number" class="field-input-small" id="overtimeHours-${worker.id}"
                               value="${overtimeHours}" min="0" max="12" step="1" maxlength="2"
                               ${!isPresent || isSaved ? 'disabled readonly' : ''}
                               onchange="updateWorkerField(${worker.id})">
                    </div>

                    <div class="field-row">
                        <label>سعر الساعة:</label>
                        <input type="number" class="field-input-small" id="overtimeRate-${worker.id}"
                               value="${overtimeRate}" min="0" step="1" maxlength="4"
                               ${!isPresent || isSaved ? 'disabled readonly' : ''}
                               onchange="updateWorkerField(${worker.id})">
                    </div>

                    <div class="field-row">
                        <label>سلف:</label>
                        <input type="number" class="field-input-small" id="advance-${worker.id}"
                               value="${advance}" min="0" step="1" maxlength="4"
                               ${isSaved ? 'disabled readonly' : ''}
                               onchange="updateWorkerField(${worker.id})">
                    </div>

                    <div class="field-row">
                        <label>تكاليف دخان:</label>
                        <input type="number" class="field-input-small" id="smokingCosts-${worker.id}"
                               value="${smokingCosts}" min="0" step="1" maxlength="4"
                               ${isSaved ? 'disabled readonly' : ''}
                               onchange="updateWorkerField(${worker.id})">
                    </div>

                    <div class="net-daily-row">
                        <label>صافي اليومية:</label>
                        <div class="net-daily-value" id="netDaily-${worker.id}" style="color: ${netDaily < 0 ? '#dc3545' : netDaily > 0 ? '#28a745' : '#6c757d'}">
                            ${netDaily.toFixed(0)} ₪
                        </div>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn tiny" onclick="editWorkerAttendance(${worker.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn tiny success" onclick="saveWorkerData(${worker.id})" title="حفظ" ${isSaved ? 'disabled' : ''}>
                        ${isSaved ? '<i class="fas fa-check"></i> محفوظ' : '<i class="fas fa-save"></i>'}
                    </button>
                </div>
            </div>`;

        attendanceCardsGrid.appendChild(card);
    });

    // تعطيل أزرار الحفظ للعمال المحفوظين
    contractorWorkers.forEach(worker => {
        const existingRecord = dateAttendance.find(record =>
            record.workerId === worker.id && record.date === selectedDate
        );

        if (existingRecord) {
            const saveButton = document.querySelector(`[data-worker-id="${worker.id}"] .btn.success`);
            if (saveButton) {
                // تحديث زر الحفظ للعامل المحفوظ
                saveButton.innerHTML = '<i class="fas fa-check"></i> محفوظ';
                saveButton.style.background = '#28a745';
                saveButton.disabled = true;
                saveButton.style.cursor = 'not-allowed';

                // إضافة class للبطاقة المحفوظة
                const card = document.querySelector(`[data-worker-id="${worker.id}"]`);
                if (card) {
                    card.classList.add('saved');
                }
            }
        }
    });

    // إعادة حساب صافي اليومية لجميع العمال
    contractorWorkers.forEach(worker => {
        updateWorkerField(worker.id);
    });

    // تحديث الإحصائيات
    document.getElementById('totalWorkers').textContent = contractorWorkers.length;
    document.getElementById('presentWorkers').textContent = presentCount;
    document.getElementById('absentWorkers').textContent = absentCount;
    document.getElementById('totalAdvances').textContent = `${totalAdvances.toFixed(2)} ₪`;
    document.getElementById('totalSmokingCosts').textContent = `${totalSmokingCosts.toFixed(2)} ₪`;
    document.getElementById('totalNetDaily').textContent = `${totalNetDaily.toFixed(2)} ₪`;

    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();

    if (contractorWorkers.length === 0) {
        attendanceCardsGrid.innerHTML = `
            <div class="empty-attendance-message">
                <i class="fas fa-users" style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h3>لا يوجد عمال نشطين</h3>
                <p>لا يوجد عمال نشطين لهذا المقاول في تاريخ ${new Date(selectedDate).toLocaleDateString('ar')}</p>
                <button class="btn success" onclick="loadPage('workers')">
                    <i class="fas fa-user-plus"></i> إدارة العمال
                </button>
            </div>
        `;
    }
}

// تحديث حالة الحضور
function updateAttendanceStatus(workerId, status) {
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    const dailyWageInput = card.querySelector('.daily-wage-input');
    const workDayInput = card.querySelector('.work-day-input');
    const overtimeHoursInput = card.querySelector('.overtime-hours-input');
    const overtimeRateInput = card.querySelector('.overtime-rate-input');

    if (status === 'present') {
        card.className = 'attendance-card present';
        dailyWageInput.disabled = false;
        workDayInput.disabled = false;
        overtimeHoursInput.disabled = false;
        overtimeRateInput.disabled = false;

        // إعادة تعيين القيم الافتراضية
        if (workDayInput.value == 0) workDayInput.value = 1;
    } else {
        card.className = 'attendance-card absent';
        dailyWageInput.disabled = true;
        workDayInput.disabled = true;
        overtimeHoursInput.disabled = true;
        overtimeRateInput.disabled = true;

        // مسح القيم عند الغياب
        workDayInput.value = 0;
        overtimeHoursInput.value = 0;
    }

    updateNetDaily(workerId);
    updateAttendanceStatisticsFromCards();
}

// دالة محذوفة - مكررة

// تحديث اليومية
function updateDailyWage(workerId, wage) {
    const row = document.querySelector(`[data-worker-id="${workerId}"]`);
    const overtimeRateInput = row.querySelector('.overtime-rate-input');

    // تحديث سعر الساعة الإضافية تلقائياً
    const newOvertimeRate = (parseFloat(wage) / 8).toFixed(2);
    overtimeRateInput.value = newOvertimeRate;

    updateNetDaily(workerId);
}

// تحديث يوم العمل
function updateWorkDay(workerId, workDay) {
    updateNetDaily(workerId);
}

// تحديث الساعات الإضافية
function updateOvertimeHours(workerId, hours) {
    updateNetDaily(workerId);
}

// تحديث سعر الساعة الإضافية
function updateOvertimeRate(workerId, rate) {
    updateNetDaily(workerId);
}

// تحديث السلف
function updateAdvance(workerId, advance) {
    updateNetDaily(workerId);
}

// تحديث تكاليف الدخان
function updateSmokingCosts(workerId, costs) {
    updateNetDaily(workerId);
}

// تحديث صافي اليومية
function updateNetDaily(workerId) {
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);

    const dailyWage = parseFloat(card.querySelector('.daily-wage-input').value) || 0;
    const workDay = parseFloat(card.querySelector('.work-day-input').value) || 0;
    const overtimeHours = parseFloat(card.querySelector('.overtime-hours-input').value) || 0;
    const overtimeRate = parseFloat(card.querySelector('.overtime-rate-input').value) || 0;
    const advance = parseFloat(card.querySelector('.advance-input').value) || 0;
    const smokingCosts = parseFloat(card.querySelector('.smoking-costs-input').value) || 0;

    const netDaily = calculateNetDaily(dailyWage, workDay, overtimeHours, overtimeRate, advance, smokingCosts);

    const netDailyAmount = card.querySelector('.net-daily-amount');
    netDailyAmount.textContent = `${netDaily.toFixed(2)} ₪`;

    // تحديث الإحصائيات العامة
    updateAttendanceStatisticsFromCards();
}

// تعديل بيانات حضور العامل
function editWorkerAttendance(workerId) {
    const selectedDate = document.getElementById('attendanceDate').value;

    // إلغاء حالة الحفظ
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const recordIndex = attendance.findIndex(record =>
        record.workerId === workerId && record.date === selectedDate
    );

    if (recordIndex !== -1) {
        attendance[recordIndex].saved = false;
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }

    // إعادة تحميل اليوميات لتفعيل الحقول
    loadAttendanceForDate();
}

// تحديث الإحصائيات من البطاقات الموجودة
function updateAttendanceStatisticsFromCards() {
    const cards = document.querySelectorAll('.worker-grid-card');
    let totalWorkers = cards.length;
    let presentCount = 0;
    let absentCount = 0;
    let totalAdvances = 0;
    let totalSmokingCosts = 0;
    let totalNetDaily = 0;

    cards.forEach(card => {
        const workerId = card.getAttribute('data-worker-id');

        // الحصول على الحالة
        const statusSelect = document.getElementById(`status-${workerId}`);
        const status = statusSelect ? statusSelect.value : 'absent';

        if (status === 'present') {
            presentCount++;
        } else {
            absentCount++;
        }

        // الحصول على القيم
        const advanceInput = document.getElementById(`advance-${workerId}`);
        const smokingCostInput = document.getElementById(`smokingCosts-${workerId}`);
        const netDailyElement = document.getElementById(`netDaily-${workerId}`);

        const advance = parseFloat(advanceInput?.value) || 0;
        const smokingCost = parseFloat(smokingCostInput?.value) || 0;
        const netDaily = parseFloat(netDailyElement?.textContent.replace(/[^\d.-]/g, '')) || 0;

        totalAdvances += advance;
        totalSmokingCosts += smokingCost;
        totalNetDaily += netDaily;
    });

    // تحديث العرض
    const totalWorkersElement = document.getElementById('totalWorkers');
    const presentWorkersElement = document.getElementById('presentWorkers');
    const absentWorkersElement = document.getElementById('absentWorkers');
    const totalAdvancesElement = document.getElementById('totalAdvances');
    const totalSmokingCostsElement = document.getElementById('totalSmokingCosts');
    const totalNetDailyElement = document.getElementById('totalNetDaily');

    if (totalWorkersElement) totalWorkersElement.textContent = totalWorkers;
    if (presentWorkersElement) presentWorkersElement.textContent = presentCount;
    if (absentWorkersElement) absentWorkersElement.textContent = absentCount;
    if (totalAdvancesElement) totalAdvancesElement.textContent = `${totalAdvances.toFixed(2)} ₪`;
    if (totalSmokingCostsElement) totalSmokingCostsElement.textContent = `${totalSmokingCosts.toFixed(2)} ₪`;
    if (totalNetDailyElement) totalNetDailyElement.textContent = `${totalNetDaily.toFixed(2)} ₪`;
    
    // تحديث إحصائيات اللوحة الرئيسية أيضاً
    updateDashboardStats();
}

// حفظ حضور عامل واحد
function saveWorkerAttendance(workerId) {
    const selectedDate = document.getElementById('attendanceDate').value;
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);

    const status = card.querySelector('.status-select').value;
    const dailyWage = parseFloat(document.getElementById(`dailyWage-${workerId}`).value) || 0;
    const workDay = parseFloat(document.getElementById(`workDay-${workerId}`).value) || 0;
    const overtimeHours = parseFloat(document.getElementById(`overtimeHours-${workerId}`).value) || 0;
    const overtimeRate = parseFloat(document.getElementById(`overtimeRate-${workerId}`).value) || 0;
    const advance = parseFloat(document.getElementById(`advance-${workerId}`).value) || 0;
    const smokingCosts = parseFloat(document.getElementById(`smokingCosts-${workerId}`).value) || 0;

    const attendanceData = {
        status,
        dailyWage,
        workDay,
        overtimeHours,
        overtimeRate,
        advance,
        smokingCosts
    };

    saveAttendanceRecord(workerId, selectedDate, attendanceData);

    // قفل الحقول بعد الحفظ
    lockWorkerFields(workerId);

    showSuccessMessage('تم حفظ بيانات العامل بنجاح!', 'save');

    // إظهار تأكيد بصري
    const saveBtn = row.querySelector('.btn.success');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    saveBtn.classList.add('saved');

    setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.classList.remove('saved');
    }, 1500);
}

// دالة محذوفة - مكررة

// تسجيل غياب عامل
function markWorkerAbsent(workerId) {
    const row = document.querySelector(`[data-worker-id="${workerId}"]`);
    const statusSelect = row.querySelector('.status-select');

    if (confirm('هل أنت متأكد من تسجيل غياب هذا العامل؟')) {
        statusSelect.value = 'absent';
        updateAttendanceStatus(workerId, 'absent');
        saveWorkerAttendance(workerId);
    }
}

// حفظ جميع سجلات الحضور
function saveAllAttendance() {
    const selectedDate = document.getElementById('attendanceDate').value;
    const rows = document.querySelectorAll('.attendance-row[data-worker-id]');

    let savedCount = 0;

    rows.forEach(row => {
        const workerId = parseInt(row.getAttribute('data-worker-id'));
        const status = row.querySelector('.status-select').value;
        const workHours = parseFloat(row.querySelector('.work-hours-input').value) || 0;
        const overtimeHours = parseFloat(row.querySelector('.overtime-hours-input').value) || 0;
        const notes = row.querySelector('.notes-input').value.trim();

        saveAttendanceRecord(workerId, selectedDate, status, workHours, overtimeHours, notes);
        savedCount++;
    });

    showSuccessMessage(`تم حفظ ${savedCount} سجل حضور بنجاح!`, 'save');
}

// تسجيل الكل حاضر
function markAllPresent() {
    if (confirm('هل تريد تسجيل جميع العمال كحاضرين؟')) {
        const statusSelects = document.querySelectorAll('.status-select');
        statusSelects.forEach(select => {
            select.value = 'present';
            const workerId = parseInt(select.closest('[data-worker-id]').getAttribute('data-worker-id'));
            updateAttendanceStatus(workerId, 'present');
        });
        updateAttendanceSummary();
    }
}

// حفظ سجل حضور في localStorage
function saveAttendanceRecord(workerId, date, attendanceData) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    // البحث عن سجل موجود
    const existingIndex = attendance.findIndex(a =>
        a.workerId === workerId && a.date === date
    );

    const record = {
        id: existingIndex !== -1 ? attendance[existingIndex].id : Date.now(),
        workerId,
        contractorId: currentContractor.id,
        date,
        status: attendanceData.status,
        dailyWage: attendanceData.status === 'present' ? attendanceData.dailyWage : 0,
        workDay: attendanceData.status === 'present' ? attendanceData.workDay : 0,
        overtimeHours: attendanceData.status === 'present' ? attendanceData.overtimeHours : 0,
        overtimeRate: attendanceData.status === 'present' ? attendanceData.overtimeRate : 0,
        advance: attendanceData.advance || 0,
        smokingCosts: attendanceData.smokingCosts || 0,
        updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
        attendance[existingIndex] = record;
    } else {
        attendance.push(record);
    }

    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();
}

// وظيفة تحديث إحصائيات اللوحة الرئيسية
function updateDashboardStats() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    
    // فلترة العمال والحضور للمقاول الحالي
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id);
    const contractorAttendance = attendance.filter(a => a.contractorId === currentContractor.id);
    
    // حساب الإحصائيات المحدثة
    const stats = calculateStats(contractorWorkers, contractorAttendance);
    
    // تحديث عرض الإحصائيات في اللوحة الرئيسية
    const totalSalariesElement = document.getElementById('totalSalaries');
    const workDaysElement = document.getElementById('workDays');
    const overtimeHoursElement = document.getElementById('overtimeHours');
    
    if (totalSalariesElement) {
        totalSalariesElement.textContent = `${stats.totalSalaries.toLocaleString()} ₪`;
    }
    if (workDaysElement) {
        workDaysElement.textContent = stats.workDays;
    }
    if (overtimeHoursElement) {
        overtimeHoursElement.textContent = stats.overtimeHours;
    }
}

// تحديث ملخص الحضور
function updateAttendanceSummary() {
    const cards = document.querySelectorAll('.attendance-card[data-worker-id]');
    let presentCount = 0;
    let absentCount = 0;

    cards.forEach(card => {
        const status = card.querySelector('.status-select').value;
        if (status === 'present') presentCount++;
        else absentCount++;
    });

    const totalElement = document.getElementById('totalWorkers');
    const presentElement = document.getElementById('presentWorkers');
    const absentElement = document.getElementById('absentWorkers');

    if (totalElement) totalElement.textContent = cards.length;
    if (presentElement) presentElement.textContent = presentCount;
    if (absentElement) absentElement.textContent = absentCount;
}

// تغيير حجم البطاقات
function changeCardSize(size) {
    const cardsContainer = document.getElementById('attendanceCardsContainer');
    if (!cardsContainer) return;

    // إزالة الكلاسات القديمة
    cardsContainer.classList.remove('cards-small', 'cards-medium', 'cards-large');

    // إضافة الكلاس الجديد
    cardsContainer.classList.add(`cards-${size}`);

    // حفظ الإعداد
    localStorage.setItem('cardSize', size);
}

// تحميل حجم البطاقات المحفوظ
function loadCardSize() {
    const savedSize = localStorage.getItem('cardSize') || 'medium';
    const select = document.getElementById('cardSizeSelect');
    if (select) {
        select.value = savedSize;
        changeCardSize(savedSize);
    }
}

// توسع/طي البطاقة
function toggleCardExpansion(workerId) {
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    const cardsContainer = document.getElementById('attendanceCardsContainer');

    // فقط في الوضع الصغير
    if (cardsContainer && cardsContainer.classList.contains('cards-small')) {
        card.classList.toggle('expanded');
    }
}

// قفل حقول العامل
function lockWorkerFields(workerId) {
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (!card) return;

    // قفل جميع الحقول
    const inputs = card.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (!input.classList.contains('status-select')) {
            input.disabled = true;
            input.classList.add('locked');
        }
    });

    // إخفاء زر الحفظ وإظهار زر التعديل
    const saveBtn = card.querySelector('.save-btn');
    const editBtn = card.querySelector('.edit-btn');

    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';

    // إضافة كلاس مقفل للبطاقة
    card.classList.add('locked');
}

// فتح حقول العامل للتعديل
function unlockWorkerFields(workerId) {
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (!card) return;

    // فتح الحقول المناسبة
    const status = card.querySelector('.status-select').value;
    const inputs = card.querySelectorAll('input');

    inputs.forEach(input => {
        input.classList.remove('locked');

        if (status === 'present') {
            input.disabled = false;
        } else {
            // في حالة الغياب، فقط السلف وتكاليف الدخان
            if (input.classList.contains('advance-input') ||
                input.classList.contains('smoking-costs-input')) {
                input.disabled = false;
            }
        }
    });

    // إظهار زر الحفظ وإخفاء زر التعديل
    const saveBtn = card.querySelector('.save-btn');
    const editBtn = card.querySelector('.edit-btn');

    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'none';

    // إزالة كلاس مقفل من البطاقة
    card.classList.remove('locked');
}

// دالة محذوفة - مكررة

// تحميل صفحة مقاولين الباطن
function loadSubcontractorsPage() {
    const pageContent = document.getElementById('subcontractorsContent');

    pageContent.innerHTML = `
        <div class="subcontractors-page-full">
            <!-- جدول مقاولين الباطن -->
            <div class="subcontractors-table-section-full">
                <div class="card">
                    <div class="table-header">
                        <h3><i class="fas fa-user-cog"></i> مقاولين الباطن</h3>
                        <div class="table-actions">
                            <button class="btn success" onclick="showAddSubcontractorModal()">
                                <i class="fas fa-user-plus"></i> إضافة مقاول باطن
                            </button>
                            <button class="btn info" onclick="showSubcontractorJobsModal()">
                                <i class="fas fa-tasks"></i> طقات مقاولين باطن
                            </button>
                            <button class="btn small" onclick="refreshSubcontractorsTable()">
                                <i class="fas fa-sync-alt"></i> تحديث
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>التخصص</th>
                                    <th>الهاتف</th>
                                    <th>الورشة</th>
                                    <th>العنوان</th>
                                    <th>تاريخ الإضافة</th>
                                    <th>الحالة</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="subcontractorsTableBody">
                                <!-- سيتم ملؤها من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- جدول طقات مقاولين الباطن -->
            <div class="subcontractor-jobs-section">
                <div class="card">
                    <div class="table-header">
                        <h3><i class="fas fa-tasks"></i> طقات مقاولين الباطن</h3>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>المقاول</th>
                                    <th>وصف المقاولة</th>
                                    <th>سعر المقاولة</th>
                                    <th>التاريخ</th>
                                    <th>الورشة</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="subcontractorJobsTableBody">
                                <!-- سيتم ملؤها من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- جدول التكاليف الإضافية -->
            <div class="additional-costs-section">
                <div class="card">
                    <div class="table-header">
                        <h3><i class="fas fa-receipt"></i> التكاليف الإضافية</h3>
                        <div class="table-actions">
                            <button class="btn success" onclick="showAddCostModal()">
                                <i class="fas fa-plus"></i> إضافة تكلفة
                            </button>
                            <button class="btn small" onclick="refreshAdditionalCostsTable()">
                                <i class="fas fa-sync-alt"></i> تحديث
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>مقاول الباطن</th>
                                    <th>وصف التكلفة</th>
                                    <th>المبلغ</th>
                                    <th>الورشة</th>
                                    <th>ملاحظات</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="additionalCostsTableBody">
                                <!-- سيتم ملؤها من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="total-costs">
                            <strong>إجمالي التكاليف الإضافية: <span id="totalAdditionalCosts">0 ₪</span></strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- نموذج إضافة مقاول باطن منبثق -->
        <div id="addSubcontractorModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-cog"></i> إضافة مقاول باطن جديد</h3>
                    <span class="close" onclick="hideAddSubcontractorModal()">&times;</span>
                </div>
                <form id="addSubcontractorForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="subcontractorName">اسم مقاول الباطن</label>
                            <input type="text" id="subcontractorName" required>
                        </div>
                        <div class="form-group">
                            <label for="subcontractorPhone">رقم الهاتف</label>
                            <input type="tel" id="subcontractorPhone">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="subcontractorSpecialty">التخصص</label>
                            <select id="subcontractorSpecialty" required>
                                <option value="">اختر التخصص</option>
                                <option value="بناء">بناء</option>
                                <option value="كهرباء">كهرباء</option>
                                <option value="سباكة">سباكة</option>
                                <option value="دهان">دهان</option>
                                <option value="بلاط">بلاط</option>
                                <option value="نجارة">نجارة</option>
                                <option value="حدادة">حدادة</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="subcontractorWorkshop">الورشة المخصصة</label>
                            <select id="subcontractorWorkshop">
                                <option value="">اختر الورشة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="subcontractorAddress">العنوان</label>
                        <input type="text" id="subcontractorAddress">
                    </div>
                    <div class="form-group">
                        <label for="subcontractorNotes">ملاحظات</label>
                        <textarea id="subcontractorNotes" rows="2"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ مقاول الباطن
                        </button>
                        <button type="button" id="cancelSubcontractorEdit" onclick="cancelSubcontractorEdit()" class="btn warning" style="display: none;">
                            <i class="fas fa-undo"></i> إلغاء التعديل
                        </button>
                        <button type="button" onclick="hideAddSubcontractorModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- نموذج إضافة طقة مقاول باطن منبثق -->
        <div id="addSubcontractorJobModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-tasks"></i> إضافة طقة مقاول باطن</h3>
                    <span class="close" onclick="hideSubcontractorJobModal()">&times;</span>
                </div>
                <form id="addSubcontractorJobForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobSubcontractor">مقاول الباطن</label>
                            <select id="jobSubcontractor" required>
                                <option value="">اختر مقاول الباطن</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="jobWorkshop">الورشة</label>
                            <select id="jobWorkshop">
                                <option value="">اختر الورشة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="jobDescription">وصف المقاولة</label>
                        <textarea id="jobDescription" rows="3" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobPrice">سعر المقاولة (شيكل)</label>
                            <input type="number" id="jobPrice" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="jobDate">التاريخ</label>
                            <input type="date" id="jobDate" required>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ الطقة
                        </button>
                        <button type="button" onclick="hideSubcontractorJobModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- نموذج إضافة تكلفة إضافية منبثق -->
        <div id="addCostModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> إضافة تكلفة إضافية</h3>
                    <span class="close" onclick="hideAddCostModal()">&times;</span>
                </div>
                <form id="addCostForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="costDate">التاريخ</label>
                            <input type="date" id="costDate" required>
                        </div>
                        <div class="form-group">
                            <label for="costSubcontractor">مقاول الباطن</label>
                            <select id="costSubcontractor" required>
                                <option value="">اختر مقاول الباطن</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="costWorkshop">الورشة</label>
                            <select id="costWorkshop">
                                <option value="">اختر الورشة</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="costAmount">المبلغ (شيكل)</label>
                            <input type="number" id="costAmount" min="0" step="0.01" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="costDescription">وصف التكلفة</label>
                        <input type="text" id="costDescription" required>
                    </div>
                    <div class="form-group">
                        <label for="costNotes">ملاحظات</label>
                        <textarea id="costNotes" rows="3"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ التكلفة
                        </button>
                        <button type="button" class="btn" onclick="hideAddCostModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // تحميل الورش في القائمة المنسدلة
    loadSubcontractorWorkshopsDropdown();

    // تحميل جدول مقاولين الباطن
    loadSubcontractorsTable();

    // تحميل جدول طقات مقاولين الباطن
    loadSubcontractorJobsTable();

    // تحميل جدول التكاليف الإضافية
    loadAdditionalCostsTable();

    // إعداد النماذج
    setupSubcontractorForms();
    setupAdditionalCostsForms();
}

// تحميل الورش في قائمة مقاولين الباطن
function loadSubcontractorWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const select = document.getElementById('subcontractorWorkshop');

    if (select) {
        select.innerHTML = '<option value="">اختر الورشة</option>';
        workshops.forEach(workshop => {
            const option = document.createElement('option');
            option.value = workshop.id;
            option.textContent = workshop.name;
            select.appendChild(option);
        });
    }
}

// تحميل جدول مقاولين الباطن
function loadSubcontractorsTable() {
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const tableBody = document.getElementById('subcontractorsTableBody');

    if (!tableBody) return;

    // تصفية مقاولين الباطن للمقاول الحالي
    const contractorSubcontractors = subcontractors.filter(s => s.contractorId === currentContractor.id);

    tableBody.innerHTML = '';

    contractorSubcontractors.forEach(subcontractor => {
        const workshop = workshops.find(w => w.id === subcontractor.workshopId);
        const row = document.createElement('tr');

        // إضافة صف أزرق فاتح للمقاول الجديد
        if (subcontractor.isNew) {
            row.classList.add('new-worker-row');
            setTimeout(() => {
                subcontractor.isNew = false;
                const updatedSubcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
                const subcontractorIndex = updatedSubcontractors.findIndex(s => s.id === subcontractor.id);
                if (subcontractorIndex !== -1) {
                    updatedSubcontractors[subcontractorIndex].isNew = false;
                    localStorage.setItem('subcontractors', JSON.stringify(updatedSubcontractors));
                }
                row.classList.remove('new-worker-row');
            }, 3000);
        }

        row.innerHTML = `
            <td>${subcontractor.name}</td>
            <td>
                <span class="specialty-badge">${subcontractor.specialty}</span>
            </td>
            <td>${subcontractor.phone || '-'}</td>
            <td>${workshop ? workshop.name : 'غير محدد'}</td>
            <td>${subcontractor.address || '-'}</td>
            <td>${new Date(subcontractor.createdAt).toLocaleDateString('ar')}</td>
            <td>
                <span class="status-badge ${subcontractor.active ? 'active' : 'inactive'}">
                    ${subcontractor.active ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>
                <button class="btn tiny" onclick="editSubcontractor(${subcontractor.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn tiny ${subcontractor.active ? 'warning' : 'success'}"
                        onclick="toggleSubcontractorStatus(${subcontractor.id})"
                        title="${subcontractor.active ? 'إيقاف' : 'تفعيل'}">
                    <i class="fas fa-${subcontractor.active ? 'pause' : 'play'}"></i>
                </button>
                <button class="btn tiny danger" onclick="deleteSubcontractor(${subcontractor.id})"
                        title="حذف مقاول الباطن">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    if (contractorSubcontractors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-user-cog" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>لا يوجد مقاولين باطن مضافين
                </td>
            </tr>
        `;
    }
}

// إظهار نموذج إضافة مقاول باطن
function showAddSubcontractorModal() {
    // إعادة تعيين العنوان للإضافة
    const modalTitle = document.querySelector('#addSubcontractorModal .modal-header h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> إضافة مقاول باطن';
    }

    // إعادة تعيين النموذج
    const form = document.getElementById('addSubcontractorForm');
    if (form) {
        form.removeAttribute('data-editing');
        form.reset();

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ مقاول الباطن';
        }

        const cancelBtn = document.getElementById('cancelSubcontractorEdit');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    }

    document.getElementById('addSubcontractorModal').style.display = 'block';
    loadSubcontractorWorkshopsDropdown();
    document.getElementById('subcontractorName').focus();
}

// إخفاء نموذج إضافة مقاول باطن
function hideAddSubcontractorModal() {
    document.getElementById('addSubcontractorModal').style.display = 'none';

    const form = document.getElementById('addSubcontractorForm');
    form.reset();
    form.removeAttribute('data-editing');

    // إعادة تعيين زر الإرسال
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ مقاول الباطن';

    // إخفاء زر إلغاء التعديل
    const cancelBtn = document.getElementById('cancelSubcontractorEdit');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }

    // إعادة تعيين عنوان النموذج
    const modalTitle = document.querySelector('#addSubcontractorModal .modal-header h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-cog"></i> إضافة مقاول باطن جديد';
    }
}

// إظهار نموذج طقات مقاولين الباطن
function showSubcontractorJobsModal() {
    // تغيير العنوان
    const modalTitle = document.querySelector('#addSubcontractorJobModal .modal-header h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> إضافة طقة مقاول باطن';
    }

    document.getElementById('addSubcontractorJobModal').style.display = 'block';
    loadJobSubcontractorsDropdown();
    loadJobWorkshopsDropdown();
    document.getElementById('jobDate').value = new Date().toISOString().split('T')[0];

    // إبقاء القائمة المنسدلة قابلة للاختيار
    const subcontractorSelect = document.getElementById('jobSubcontractor');
    if (subcontractorSelect) {
        subcontractorSelect.disabled = false; // السماح بالاختيار
        subcontractorSelect.selectedIndex = 0; // العودة للخيار الافتراضي
    }

    document.getElementById('jobDescription').focus();
}

// إخفاء نموذج طقات مقاولين الباطن
function hideSubcontractorJobModal() {
    document.getElementById('addSubcontractorJobModal').style.display = 'none';
    document.getElementById('addSubcontractorJobForm').reset();

    // إعادة تفعيل القائمة المنسدلة
    const subcontractorSelect = document.getElementById('jobSubcontractor');
    if (subcontractorSelect) {
        subcontractorSelect.disabled = false;
    }
}

// تحميل مقاولين الباطن في قائمة الطقات
function loadJobSubcontractorsDropdown() {
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const select = document.getElementById('jobSubcontractor');

    if (select) {
        select.innerHTML = '<option value="">اختر مقاول الباطن</option>';
        const contractorSubcontractors = subcontractors.filter(s =>
            s.contractorId === currentContractor.id && s.active
        );

        contractorSubcontractors.forEach(subcontractor => {
            const option = document.createElement('option');
            option.value = subcontractor.id;
            option.textContent = subcontractor.name;
            select.appendChild(option);
        });
    }
}

// تحميل الورش في قائمة الطقات
function loadJobWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const select = document.getElementById('jobWorkshop');

    if (select) {
        select.innerHTML = '<option value="">اختر الورشة</option>';
        workshops.forEach(workshop => {
            const option = document.createElement('option');
            option.value = workshop.id;
            option.textContent = workshop.name;
            select.appendChild(option);
        });
    }
}

// تحميل جدول طقات مقاولين الباطن
function loadSubcontractorJobsTable() {
    const jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const tableBody = document.getElementById('subcontractorJobsTableBody');

    if (!tableBody) return;

    // تصفية الطقات للمقاول الحالي
    const contractorJobs = jobs.filter(j => j.contractorId === currentContractor.id);

    tableBody.innerHTML = '';

    contractorJobs.forEach(job => {
        const subcontractor = subcontractors.find(s => s.id === job.subcontractorId);
        const workshop = workshops.find(w => w.id === job.workshopId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${subcontractor ? subcontractor.name : 'غير محدد'}</td>
            <td>${job.description}</td>
            <td>${job.price.toLocaleString()} ₪</td>
            <td>${new Date(job.date).toLocaleDateString('ar')}</td>
            <td>${workshop ? workshop.name : 'غير محدد'}</td>
            <td>
                <button class="btn small" onclick="editSubcontractorJob(${job.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn small danger" onclick="deleteSubcontractorJob(${job.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    if (contractorJobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>لا توجد طقات مسجلة
                </td>
            </tr>
        `;
    }
}

// إعداد نماذج مقاولين الباطن
function setupSubcontractorForms() {
    const subcontractorForm = document.getElementById('addSubcontractorForm');
    const jobForm = document.getElementById('addSubcontractorJobForm');

    if (subcontractorForm) {
        subcontractorForm.addEventListener('submit', handleSubcontractorSubmit);
    }

    if (jobForm) {
        jobForm.addEventListener('submit', handleSubcontractorJobSubmit);
    }

    // إغلاق النماذج عند النقر خارجها
    window.addEventListener('click', function(e) {
        const subcontractorModal = document.getElementById('addSubcontractorModal');
        const jobModal = document.getElementById('addSubcontractorJobModal');

        if (e.target === subcontractorModal) {
            hideAddSubcontractorModal();
        }
        if (e.target === jobModal) {
            hideSubcontractorJobModal();
        }
    });
}

// معالجة إرسال نموذج مقاول الباطن
function handleSubcontractorSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        name: document.getElementById('subcontractorName').value.trim(),
        phone: document.getElementById('subcontractorPhone').value.trim(),
        specialty: document.getElementById('subcontractorSpecialty').value,
        workshopId: document.getElementById('subcontractorWorkshop').value || null,
        address: document.getElementById('subcontractorAddress').value.trim(),
        notes: document.getElementById('subcontractorNotes').value.trim()
    };

    if (!formData.name || !formData.specialty) {
        alert('الرجاء ملء الحقول المطلوبة (الاسم والتخصص)');
        return;
    }

    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];

    if (editingId) {
        // تحديث مقاول باطن موجود
        const subcontractorIndex = subcontractors.findIndex(s => s.id === parseInt(editingId));

        if (subcontractorIndex !== -1) {
            subcontractors[subcontractorIndex] = {
                ...subcontractors[subcontractorIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ مقاول الباطن';

        showSuccessMessage('تم تحديث بيانات مقاول الباطن بنجاح!', 'user-edit');
    } else {
        // إضافة مقاول باطن جديد
        const newId = subcontractors.length > 0 ? Math.max(...subcontractors.map(s => s.id)) + 1 : 1;

        const newSubcontractor = {
            id: newId,
            contractorId: currentContractor.id,
            contractorName: currentContractor.name,
            ...formData,
            active: true,
            isNew: true,
            createdAt: new Date().toISOString()
        };

        subcontractors.push(newSubcontractor);
        showSuccessMessage('تم إضافة مقاول الباطن بنجاح!', 'user-cog');
    }

    localStorage.setItem('subcontractors', JSON.stringify(subcontractors));

    // إخفاء النموذج
    hideAddSubcontractorModal();

    // تحديث الجدول
    loadSubcontractorsTable();
}

// معالجة إرسال نموذج طقة مقاول الباطن
function handleSubcontractorJobSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        subcontractorId: parseInt(document.getElementById('jobSubcontractor').value),
        description: document.getElementById('jobDescription').value.trim(),
        price: parseFloat(document.getElementById('jobPrice').value),
        date: document.getElementById('jobDate').value,
        workshopId: document.getElementById('jobWorkshop').value || null
    };

    if (!formData.subcontractorId || !formData.description || !formData.price || !formData.date) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    let jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];

    if (editingId) {
        // تعديل طقة موجودة
        const jobIndex = jobs.findIndex(j => j.id == editingId);
        if (jobIndex !== -1) {
            jobs[jobIndex] = {
                ...jobs[jobIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الطقة';

        showSuccessMessage('تم تحديث بيانات الطقة بنجاح!', 'edit');
    } else {
        // إضافة طقة جديدة
        const newId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1;

        const newJob = {
            id: newId,
            contractorId: currentContractor.id,
            ...formData,
            createdAt: new Date().toISOString()
        };

        jobs.push(newJob);
        showSuccessMessage('تم إضافة الطقة بنجاح!', 'plus');
    }

    localStorage.setItem('subcontractorJobs', JSON.stringify(jobs));

    // إخفاء النموذج
    hideSubcontractorJobModal();

    // تحديث الجدول
    loadSubcontractorJobsTable();
}

// تعديل طقة مقاول باطن
function editSubcontractorJob(jobId) {
    const jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];
    const job = jobs.find(j => j.id === jobId);

    if (job) {
        // ملء النموذج ببيانات الطقة
        document.getElementById('jobSubcontractor').value = job.subcontractorId;
        document.getElementById('jobDescription').value = job.description;
        document.getElementById('jobPrice').value = job.price;
        document.getElementById('jobDate').value = job.date;
        document.getElementById('jobWorkshop').value = job.workshopId || '';

        // فتح النموذج
        showSubcontractorJobsModal();

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addSubcontractorJobForm');
        form.setAttribute('data-editing', jobId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث الطقة';
    }
}

// حذف طقة مقاول باطن
function deleteSubcontractorJob(jobId) {
    if (confirm('هل أنت متأكد من حذف هذه الطقة؟')) {
        let jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];
        jobs = jobs.filter(j => j.id !== jobId);
        localStorage.setItem('subcontractorJobs', JSON.stringify(jobs));
        loadSubcontractorJobsTable();
        alert('تم حذف الطقة بنجاح!');
    }
}

// تحديث جدول مقاولين الباطن
function refreshSubcontractorsTable() {
    loadSubcontractorsTable();
    loadSubcontractorJobsTable();
}

// تعديل مقاول باطن
function editSubcontractor(subcontractorId) {
    console.log('🔧 بدء تعديل مقاول الباطن:', subcontractorId);

    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const subcontractor = subcontractors.find(s => s.id === subcontractorId);

    if (subcontractor) {
        // فتح النموذج أولاً
        showAddSubcontractorModal();

        // ملء النموذج ببيانات مقاول الباطن
        document.getElementById('subcontractorName').value = subcontractor.name;
        document.getElementById('subcontractorPhone').value = subcontractor.phone || '';
        document.getElementById('subcontractorSpecialty').value = subcontractor.specialty;
        document.getElementById('subcontractorWorkshop').value = subcontractor.workshopId || '';
        document.getElementById('subcontractorAddress').value = subcontractor.address || '';
        document.getElementById('subcontractorNotes').value = subcontractor.notes || '';

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addSubcontractorForm');
        form.setAttribute('data-editing', subcontractorId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث مقاول الباطن';

        // إظهار زر إلغاء التعديل
        const cancelBtn = document.getElementById('cancelSubcontractorEdit');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }

        // تغيير عنوان النموذج
        const modalTitle = document.querySelector('#addSubcontractorModal .modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> تعديل مقاول الباطن';
        }

        console.log('تم فتح نموذج تعديل مقاول الباطن:', subcontractor.name);
    }
}

// إلغاء تعديل مقاول الباطن
function cancelSubcontractorEdit() {
    const form = document.getElementById('addSubcontractorForm');
    form.removeAttribute('data-editing');
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ مقاول الباطن';

    // إخفاء زر إلغاء التعديل
    const cancelBtn = document.getElementById('cancelSubcontractorEdit');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }

    // إعادة تعيين عنوان النموذج
    const modalTitle = document.querySelector('#addSubcontractorModal .modal-header h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-cog"></i> إضافة مقاول باطن جديد';
    }
}

// إلغاء تعديل مقاول الباطن
function cancelSubcontractorEdit() {
    const form = document.getElementById('addSubcontractorForm');
    form.removeAttribute('data-editing');
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ مقاول الباطن';

    const cancelBtn = document.getElementById('cancelSubcontractorEdit');
    cancelBtn.style.display = 'none';
}

// تبديل حالة مقاول الباطن
function toggleSubcontractorStatus(subcontractorId) {
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const subcontractorIndex = subcontractors.findIndex(s => s.id === subcontractorId);

    if (subcontractorIndex !== -1) {
        const subcontractor = subcontractors[subcontractorIndex];
        const newStatus = !subcontractor.active;
        const action = newStatus ? 'تفعيل' : 'إيقاف';
        const actionColor = newStatus ? 'success' : 'warning';

        showSubcontractorConfirmDialog(
            `${action} مقاول الباطن`,
            `هل أنت متأكد من ${action} مقاول الباطن "${subcontractor.name}"؟`,
            '',
            action,
            actionColor,
            () => {
                subcontractors[subcontractorIndex].active = newStatus;
                localStorage.setItem('subcontractors', JSON.stringify(subcontractors));
                loadSubcontractorsTable();
                showSubcontractorSuccessMessage(`تم ${action} مقاول الباطن بنجاح!`);
            }
        );
    }
}

// حذف مقاول الباطن
function deleteSubcontractor(subcontractorId) {
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const subcontractor = subcontractors.find(s => s.id === subcontractorId);

    if (subcontractor) {
        showSubcontractorConfirmDialog(
            'حذف مقاول الباطن',
            `هل أنت متأكد من حذف مقاول الباطن "${subcontractor.name}"؟`,
            'سيتم حذف جميع الطقات المرتبطة به.',
            'حذف',
            'danger',
            () => {
                // حذف مقاول الباطن
                const updatedSubcontractors = subcontractors.filter(s => s.id !== subcontractorId);
                localStorage.setItem('subcontractors', JSON.stringify(updatedSubcontractors));

                // حذف جميع الطقات المرتبطة بهذا المقاول
                let jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];
                jobs = jobs.filter(j => j.subcontractorId !== subcontractorId);
                localStorage.setItem('subcontractorJobs', JSON.stringify(jobs));

                // تحديث الجداول
                loadSubcontractorsTable();
                loadSubcontractorJobsTable();

                showSubcontractorSuccessMessage('تم حذف مقاول الباطن وجميع طقاته بنجاح!');
            }
        );
    }
}

// تحميل صفحة حسابات المعاليم
function loadForemenAccountsPage() {
    const pageContent = document.getElementById('foremen-accountsContent');

    pageContent.innerHTML = `
        <div class="foremen-accounts-page-centered">
            <!-- قسم قائمة المعاليم -->
            <div class="foremen-list-section-centered">
                <div class="card">
                    <div class="table-header">
                        <h3><i class="fas fa-users"></i> قائمة المعاليم</h3>
                        <div class="foremen-header-actions">
                            <button class="btn success" onclick="showAddForemanModal()">
                                <i class="fas fa-user-plus"></i> إضافة معلم جديد
                            </button>
                            <div class="total-expenses">
                                <span class="total-label">إجمالي مصاريف المعاليم:</span>
                                <span class="total-amount" id="totalForemenExpenses">0 ₪</span>
                            </div>
                        </div>
                    </div>
                    <div class="foremen-cards" id="foremenCards">
                        <!-- سيتم ملؤها من JavaScript -->
                    </div>
                </div>
            </div>
        </div>

        <!-- نموذج إضافة معلم منبثق -->
        <div id="addForemanModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> إضافة معلم جديد</h3>
                    <span class="close" onclick="hideAddForemanModal()">&times;</span>
                </div>
                <form id="addForemanForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="foremanName">اسم المعلم</label>
                            <input type="text" id="foremanName" required>
                        </div>
                        <div class="form-group">
                            <label for="foremanPhone">رقم الهاتف</label>
                            <input type="tel" id="foremanPhone">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="foremanSpecialty">التخصص</label>
                            <select id="foremanSpecialty" required>
                                <option value="">اختر التخصص</option>
                                <option value="معلم بناء">معلم بناء</option>
                                <option value="معلم كهرباء">معلم كهرباء</option>
                                <option value="معلم سباكة">معلم سباكة</option>
                                <option value="معلم دهان">معلم دهان</option>
                                <option value="معلم بلاط">معلم بلاط</option>
                                <option value="معلم نجارة">معلم نجارة</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="foremanWorkshop">الورشة</label>
                            <select id="foremanWorkshop">
                                <option value="">اختر الورشة</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="foremanNotes">ملاحظات</label>
                        <textarea id="foremanNotes" rows="2"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ المعلم
                        </button>
                        <button type="button" onclick="hideAddForemanModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

            <!-- قسم إضافة مصروف -->
            <div class="add-expense-section" style="display: none;">
                <div class="card">
                    <h3><i class="fas fa-plus-circle"></i> إضافة مصروف جديد</h3>
                    <form id="addExpenseForm">
                        <input type="hidden" id="expenseForemanId">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseDescription">وصف المصروف</label>
                                <input type="text" id="expenseDescription" required>
                            </div>
                            <div class="form-group">
                                <label for="expenseAmount">المبلغ (شيكل)</label>
                                <input type="number" id="expenseAmount" min="0" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expenseDate">التاريخ</label>
                                <input type="date" id="expenseDate" required>
                            </div>
                            <div class="form-group">
                                <label for="expenseWorkshop">الورشة</label>
                                <select id="expenseWorkshop">
                                    <option value="">اختر الورشة</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="expenseNotes">ملاحظات</label>
                            <textarea id="expenseNotes" rows="2"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn success">
                                <i class="fas fa-save"></i> حفظ المصروف
                            </button>
                            <button type="button" onclick="hideExpenseForm()" class="btn">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // تحميل الورش في القوائم المنسدلة
    loadForemenWorkshopsDropdown();

    // تحميل قائمة المعاليم
    loadForemenList();

    // إعداد النماذج
    setupForemenForms();
}

// تحميل الورش في قوائم المعاليم
function loadForemenWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const foremanSelect = document.getElementById('foremanWorkshop');
    const expenseSelect = document.getElementById('expenseWorkshop');

    [foremanSelect, expenseSelect].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">اختر الورشة</option>';
            workshops.forEach(workshop => {
                const option = document.createElement('option');
                option.value = workshop.id;
                option.textContent = workshop.name;
                select.appendChild(option);
            });
        }
    });
}

// تحميل قائمة المعاليم
function loadForemenList() {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const foremenCards = document.getElementById('foremenCards');

    if (!foremenCards) return;

    // تصفية المعاليم للمقاول الحالي
    const contractorForemen = foremen.filter(f => f.contractorId === currentContractor.id);

    foremenCards.innerHTML = '';

    let totalExpenses = 0;

    contractorForemen.forEach(foreman => {
        // حساب مصاريف المعلم
        const foremanExpenses = expenses.filter(e => e.foremanId === foreman.id);
        const foremanTotal = foremanExpenses.reduce((sum, e) => sum + e.amount, 0);
        totalExpenses += foremanTotal;

        const workshop = workshops.find(w => w.id === foreman.workshopId);

        const card = document.createElement('div');
        card.className = 'foreman-card';
        card.innerHTML = `
            <div class="foreman-header">
                <div class="foreman-info">
                    <h4>${foreman.name}</h4>
                    <p><i class="fas fa-tools"></i> ${foreman.specialty}</p>
                    <p><i class="fas fa-building"></i> ${workshop ? workshop.name : 'غير محدد'}</p>
                    ${foreman.phone ? `<p><i class="fas fa-phone"></i> ${foreman.phone}</p>` : ''}
                </div>
                <div class="foreman-total">
                    <span class="total-label">إجمالي المصاريف</span>
                    <span class="total-amount">${foremanTotal.toLocaleString()} ₪</span>
                </div>
            </div>

            <div class="foreman-actions">
                <button class="btn small success" onclick="showExpenseForm(${foreman.id})">
                    <i class="fas fa-plus"></i> إضافة مصروف
                </button>
                <button class="btn small" onclick="viewForemanExpenses(${foreman.id})">
                    <i class="fas fa-list"></i> عرض المصاريف
                </button>
                <button class="btn small" onclick="editForeman(${foreman.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </div>

            <div class="expenses-table" id="expenses-${foreman.id}" style="display: none;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>الوصف</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>الورشة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${foremanExpenses.map(expense => {
                            const expenseWorkshop = workshops.find(w => w.id === expense.workshopId);
                            return `
                                <tr>
                                    <td>${expense.description}</td>
                                    <td>${expense.amount.toLocaleString()} ₪</td>
                                    <td>${new Date(expense.date).toLocaleDateString('ar')}</td>
                                    <td>${expenseWorkshop ? expenseWorkshop.name : '-'}</td>
                                    <td>
                                        <button class="btn tiny" onclick="editExpense(${expense.id})" title="تعديل">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn tiny danger" onclick="deleteExpense(${expense.id})" title="حذف">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ${foremanExpenses.length === 0 ? '<p style="text-align: center; color: #6c757d; padding: 1rem;">لا توجد مصاريف مسجلة</p>' : ''}
            </div>
        `;

        foremenCards.appendChild(card);
    });

    // تحديث إجمالي المصاريف
    document.getElementById('totalForemenExpenses').textContent = `${totalExpenses.toLocaleString()} ₪`;

    if (contractorForemen.length === 0) {
        foremenCards.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <h4>لا يوجد معاليم مضافين</h4>
                <p>ابدأ بإضافة معلم جديد</p>
            </div>
        `;
    }
}

// إظهار نموذج إضافة معلم
function showAddForemanModal() {
    document.getElementById('addForemanModal').style.display = 'block';
    loadForemenWorkshopsDropdown();
    document.getElementById('foremanName').focus();
}

// إخفاء نموذج إضافة معلم
function hideAddForemanModal() {
    document.getElementById('addForemanModal').style.display = 'none';
    document.getElementById('addForemanForm').reset();
}

// إعداد نماذج المعاليم
function setupForemenForms() {
    const foremanForm = document.getElementById('addForemanForm');
    const expenseForm = document.getElementById('addExpenseForm');

    if (foremanForm) {
        foremanForm.addEventListener('submit', handleForemanSubmit);
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    // تعيين التاريخ الحالي
    const expenseDateInput = document.getElementById('expenseDate');
    if (expenseDateInput) {
        expenseDateInput.value = new Date().toISOString().split('T')[0];
    }

    // إغلاق النموذج عند النقر خارجه
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('addForemanModal');
        if (e.target === modal) {
            hideAddForemanModal();
        }
    });
}

// معالجة إرسال نموذج المعلم
function handleForemanSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        name: document.getElementById('foremanName').value.trim(),
        phone: document.getElementById('foremanPhone').value.trim(),
        specialty: document.getElementById('foremanSpecialty').value,
        workshopId: document.getElementById('foremanWorkshop').value || null,
        notes: document.getElementById('foremanNotes').value.trim()
    };

    if (!formData.name || !formData.specialty) {
        alert('الرجاء ملء الحقول المطلوبة (الاسم والتخصص)');
        return;
    }

    let foremen = JSON.parse(localStorage.getItem('foremen')) || [];

    if (editingId) {
        // تعديل معلم موجود
        const foremanIndex = foremen.findIndex(f => f.id == editingId);
        if (foremanIndex !== -1) {
            foremen[foremanIndex] = {
                ...foremen[foremanIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المعلم';

        showSuccessMessage('تم تحديث بيانات المعلم بنجاح!', 'user-edit');
    } else {
        // إضافة معلم جديد
        const newId = foremen.length > 0 ? Math.max(...foremen.map(f => f.id)) + 1 : 1;

        const newForeman = {
            id: newId,
            contractorId: currentContractor.id,
            contractorName: currentContractor.name,
            ...formData,
            createdAt: new Date().toISOString()
        };

        foremen.push(newForeman);
        showSuccessMessage('تم إضافة المعلم بنجاح!', 'user-plus');
    }

    localStorage.setItem('foremen', JSON.stringify(foremen));

    // إخفاء النموذج
    hideAddForemanModal();

    // تحديث القائمة
    loadForemenList();
}

// إظهار نموذج إضافة مصروف
function showExpenseForm(foremanId) {
    const expenseSection = document.querySelector('.add-expense-section');
    const foremanIdInput = document.getElementById('expenseForemanId');

    if (expenseSection && foremanIdInput) {
        foremanIdInput.value = foremanId;
        expenseSection.style.display = 'block';
        expenseSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// إخفاء نموذج إضافة مصروف
function hideExpenseForm() {
    const expenseSection = document.querySelector('.add-expense-section');
    if (expenseSection) {
        expenseSection.style.display = 'none';

        const form = document.getElementById('addExpenseForm');
        form.reset();
        form.removeAttribute('data-editing');

        // إعادة تعيين النص والعنوان
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المصروف';
        }

        const sectionTitle = document.querySelector('.add-expense-section h3');
        if (sectionTitle) {
            sectionTitle.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة مصروف جديد';
        }
    }
}

// معالجة إرسال نموذج المصروف
function handleExpenseSubmit(e) {
    e.preventDefault();

    const formData = {
        foremanId: parseInt(document.getElementById('expenseForemanId').value),
        description: document.getElementById('expenseDescription').value.trim(),
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value,
        workshopId: document.getElementById('expenseWorkshop').value || null,
        notes: document.getElementById('expenseNotes').value.trim()
    };

    if (!formData.description || !formData.amount || !formData.date) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    // التحقق من وضع التعديل
    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    let expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];

    if (editingId) {
        // تحديث مصروف موجود
        const expenseIndex = expenses.findIndex(e => e.id === parseInt(editingId));
        if (expenseIndex !== -1) {
            expenses[expenseIndex] = {
                ...expenses[expenseIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
            showSuccessMessage('تم تحديث بيانات المصروف بنجاح!', 'edit');
        }
    } else {
        // إضافة مصروف جديد
        const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;

        const newExpense = {
            id: newId,
            contractorId: currentContractor.id,
            ...formData,
            createdAt: new Date().toISOString()
        };

        expenses.push(newExpense);
        showSuccessMessage('تم إضافة المصروف بنجاح!', 'plus');
    }

    localStorage.setItem('foremanExpenses', JSON.stringify(expenses));

    // إخفاء النموذج
    hideExpenseForm();

    // تحديث القائمة
    loadForemenList();
}

// عرض مصاريف المعلم
function viewForemanExpenses(foremanId) {
    const expensesTable = document.getElementById(`expenses-${foremanId}`);
    if (expensesTable) {
        const isVisible = expensesTable.style.display !== 'none';
        expensesTable.style.display = isVisible ? 'none' : 'block';
    }
}

// تعديل معلم
function editForeman(foremanId) {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const foreman = foremen.find(f => f.id === foremanId);

    if (foreman) {
        // ملء النموذج ببيانات المعلم
        document.getElementById('foremanName').value = foreman.name;
        document.getElementById('foremanPhone').value = foreman.phone || '';
        document.getElementById('foremanSpecialty').value = foreman.specialty;
        document.getElementById('foremanWorkshop').value = foreman.workshopId || '';
        document.getElementById('foremanNotes').value = foreman.notes || '';

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addForemanForm');
        form.setAttribute('data-editing', foremanId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث المعلم';

        const cancelBtn = document.getElementById('cancelForemanEdit');
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = cancelForemanEdit;

        // التمرير للنموذج
        document.querySelector('.add-foreman-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// تعديل معلم
function editForeman(foremanId) {
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const foreman = foremen.find(f => f.id === foremanId);

    if (foreman) {
        // ملء النموذج ببيانات المعلم
        document.getElementById('foremanName').value = foreman.name;
        document.getElementById('foremanPhone').value = foreman.phone || '';
        document.getElementById('foremanSpecialty').value = foreman.specialty;
        document.getElementById('foremanWorkshop').value = foreman.workshopId || '';
        document.getElementById('foremanNotes').value = foreman.notes || '';

        // فتح النموذج
        showAddForemanModal();

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addForemanForm');
        form.setAttribute('data-editing', foremanId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث المعلم';
    }
}

// إلغاء تعديل المعلم
function cancelForemanEdit() {
    const form = document.getElementById('addForemanForm');
    form.removeAttribute('data-editing');
    form.reset();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المعلم';

    const cancelBtn = document.getElementById('cancelForemanEdit');
    cancelBtn.style.display = 'none';
}

// تعديل مصروف
function editExpense(expenseId) {
    console.log('🔧 بدء تعديل المصروف:', expenseId);

    const expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];
    const expense = expenses.find(e => e.id === expenseId);

    if (expense) {
        // ملء النافذة المنبثقة ببيانات المصروف
        document.getElementById('editExpenseId').value = expense.id;
        document.getElementById('editExpenseForemanId').value = expense.foremanId;
        document.getElementById('editExpenseDescription').value = expense.description;
        document.getElementById('editExpenseAmount').value = expense.amount;
        document.getElementById('editExpenseDate').value = expense.date;
        document.getElementById('editExpenseWorkshop').value = expense.workshopId || '';
        document.getElementById('editExpenseNotes').value = expense.notes || '';

        // تحميل قائمة الورش
        loadEditExpenseWorkshopsDropdown();

        // إظهار النافذة المنبثقة
        showEditExpenseModal();

        console.log('تم فتح نافذة تعديل المصروف:', expense.description);
    }
}

// حذف مصروف
function deleteExpense(expenseId) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        let expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];
        expenses = expenses.filter(e => e.id !== expenseId);
        localStorage.setItem('foremanExpenses', JSON.stringify(expenses));
        loadForemenList();
        alert('تم حذف المصروف بنجاح!');
    }
}

// تحميل صفحة الورش
function loadWorkshopsPage() {
    const pageContent = document.getElementById('workshopsContent');

    pageContent.innerHTML = `
        <div class="workshops-page-full">
            <!-- جدول الورش -->
            <div class="workshops-table-section-full">
                <div class="card">
                    <div class="table-header">
                        <h3><i class="fas fa-building"></i> قائمة الورش</h3>
                        <div class="table-actions">
                            <button class="btn success" onclick="showAddWorkshopModal()">
                                <i class="fas fa-plus"></i> إضافة ورشة جديدة
                            </button>
                            <button class="btn small" onclick="refreshWorkshopsTable()">
                                <i class="fas fa-sync-alt"></i> تحديث
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>اسم الورشة</th>
                                    <th>الموقع</th>
                                    <th>المدير</th>
                                    <th>رقم الهاتف</th>
                                    <th>عدد العمال</th>
                                    <th>تاريخ الإنشاء</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="workshopsTableBody">
                                <!-- سيتم ملؤها من JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- نموذج إضافة ورشة منبثق -->
        <div id="addWorkshopModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-building"></i> إضافة ورشة جديدة</h3>
                    <span class="close" onclick="hideAddWorkshopModal()">&times;</span>
                </div>
                <form id="addWorkshopForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workshopName">اسم الورشة</label>
                            <input type="text" id="workshopName" required>
                        </div>
                        <div class="form-group">
                            <label for="workshopLocation">الموقع</label>
                            <input type="text" id="workshopLocation">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workshopManager">مدير الورشة</label>
                            <input type="text" id="workshopManager">
                        </div>
                        <div class="form-group">
                            <label for="workshopPhone">رقم الهاتف</label>
                            <input type="tel" id="workshopPhone">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="workshopNotes">ملاحظات</label>
                        <textarea id="workshopNotes" rows="3"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ الورشة
                        </button>
                        <button type="button" onclick="hideAddWorkshopModal()" class="btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // تحميل جدول الورش
    loadWorkshopsTable();

    // إعداد النموذج
    setupWorkshopForm();
}

// إظهار نموذج إضافة ورشة
function showAddWorkshopModal() {
    document.getElementById('addWorkshopModal').style.display = 'block';
    document.getElementById('workshopName').focus();
}

// إخفاء نموذج إضافة ورشة
function hideAddWorkshopModal() {
    document.getElementById('addWorkshopModal').style.display = 'none';
    document.getElementById('addWorkshopForm').reset();
}

// تحميل جدول الورش
function loadWorkshopsTable() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const tableBody = document.getElementById('workshopsTableBody');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    workshops.forEach(workshop => {
        // عدد العمال في هذه الورشة
        const workshopWorkers = workers.filter(w => w.workshopId === workshop.id);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${workshop.name}</td>
            <td>${workshop.location || '-'}</td>
            <td>${workshop.manager || '-'}</td>
            <td>${workshop.phone || '-'}</td>
            <td>${workshopWorkers.length}</td>
            <td>${new Date(workshop.createdAt || Date.now()).toLocaleDateString('ar')}</td>
            <td>
                <button class="btn small" onclick="editWorkshop(${workshop.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn small danger" onclick="deleteWorkshop(${workshop.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    if (workshops.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6c757d;">
                    <i class="fas fa-building" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <br>لا توجد ورش مضافة
                </td>
            </tr>
        `;
    }
}

// إعداد نموذج الورشة
function setupWorkshopForm() {
    const form = document.getElementById('addWorkshopForm');

    if (form) {
        form.addEventListener('submit', handleWorkshopSubmit);
    }

    // إغلاق النموذج عند النقر خارجه
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('addWorkshopModal');
        if (e.target === modal) {
            hideAddWorkshopModal();
        }
    });
}

// معالجة إرسال نموذج الورشة
function handleWorkshopSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const editingId = form.getAttribute('data-editing');

    const formData = {
        name: document.getElementById('workshopName').value.trim(),
        location: document.getElementById('workshopLocation').value.trim(),
        manager: document.getElementById('workshopManager').value.trim(),
        phone: document.getElementById('workshopPhone').value.trim(),
        notes: document.getElementById('workshopNotes').value.trim()
    };

    if (!formData.name) {
        alert('الرجاء إدخال اسم الورشة');
        return;
    }

    let workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    if (editingId) {
        // تعديل ورشة موجودة
        const workshopIndex = workshops.findIndex(w => w.id == editingId);
        if (workshopIndex !== -1) {
            workshops[workshopIndex] = {
                ...workshops[workshopIndex],
                ...formData,
                updatedAt: new Date().toISOString()
            };
        }

        // إزالة وضع التعديل
        form.removeAttribute('data-editing');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الورشة';

        showSuccessMessage('تم تحديث بيانات الورشة بنجاح!', 'edit');
    } else {
        // إضافة ورشة جديدة
        const newId = workshops.length > 0 ? Math.max(...workshops.map(w => w.id)) + 1 : 1;

        const newWorkshop = {
            id: newId,
            ...formData,
            createdAt: new Date().toISOString()
        };

        workshops.push(newWorkshop);
        showSuccessMessage('تم إضافة الورشة بنجاح!', 'industry');
    }

    localStorage.setItem('workshops', JSON.stringify(workshops));

    // إخفاء النموذج
    hideAddWorkshopModal();

    // تحديث الجدول
    loadWorkshopsTable();
}

// تحديث جدول الورش
function refreshWorkshopsTable() {
    loadWorkshopsTable();
}

// تعديل ورشة
function editWorkshop(workshopId) {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshop = workshops.find(w => w.id === workshopId);

    if (workshop) {
        // ملء النموذج ببيانات الورشة
        document.getElementById('workshopName').value = workshop.name;
        document.getElementById('workshopLocation').value = workshop.location || '';
        document.getElementById('workshopManager').value = workshop.manager || '';
        document.getElementById('workshopPhone').value = workshop.phone || '';
        document.getElementById('workshopNotes').value = workshop.notes || '';

        // فتح النموذج
        showAddWorkshopModal();

        // تغيير النموذج لوضع التعديل
        const form = document.getElementById('addWorkshopForm');
        form.setAttribute('data-editing', workshopId);

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> تحديث الورشة';
    }
}

// إخفاء نموذج إضافة ورشة (محسن)
function hideAddWorkshopModal() {
    document.getElementById('addWorkshopModal').style.display = 'none';
    const form = document.getElementById('addWorkshopForm');
    form.reset();

    // إزالة وضع التعديل
    form.removeAttribute('data-editing');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الورشة';
}

// حذف ورشة
function deleteWorkshop(workshopId) {
    if (confirm('هل أنت متأكد من حذف هذه الورشة؟')) {
        let workshops = JSON.parse(localStorage.getItem('workshops')) || [];
        workshops = workshops.filter(w => w.id !== workshopId);
        localStorage.setItem('workshops', JSON.stringify(workshops));
        loadWorkshopsTable();
        alert('تم حذف الورشة بنجاح!');
    }
}

// تحميل صفحة التقارير
function loadReportsPage() {
    const pageContent = document.getElementById('reportsContent');

    pageContent.innerHTML = `
        <div class="reports-page">
            <!-- رأس التقارير -->
            <div class="reports-header">
                <h2><i class="fas fa-chart-bar"></i> التقارير والإحصائيات</h2>
                <p>اختر نوع التقرير والفترة الزمنية المطلوبة</p>
            </div>

            <!-- أنواع التقارير -->
            <div class="reports-types">
                <div class="report-type-card" onclick="showWorkersReportForm()">
                    <div class="report-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>تقارير العمال</h3>
                    <p>تقرير مفصل لحضور وأجور العمال</p>
                </div>

                <div class="report-type-card" onclick="showForemenReportForm()">
                    <div class="report-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h3>تقارير المعاليم</h3>
                    <p>تقرير مصاريف ونشاطات المعاليم</p>
                </div>

                <div class="report-type-card" onclick="showSubcontractorsReportForm()">
                    <div class="report-icon">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <h3>تقارير مقاولين الباطن</h3>
                    <p>تقرير طقات ومدفوعات مقاولين الباطن</p>
                </div>

                <div class="report-type-card" onclick="showAllWorkersReportForm()">
                    <div class="report-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>الإجمالي لكل العمال</h3>
                    <p>تقرير إجمالي شامل لجميع العمال في فترة محددة</p>
                </div>
            </div>

            <!-- منطقة عرض التقارير -->
            <div id="reportDisplay" class="report-display" style="display: none;">
                <!-- سيتم ملؤها بالتقرير المطلوب -->
            </div>
        </div>

        <!-- نموذج تقرير العمال -->
        <div id="workersReportModal" class="modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> تقرير العمال</h3>
                    <span class="close" onclick="hideWorkersReportModal()">&times;</span>
                </div>
                <div class="report-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="workersReportFromDate">من تاريخ</label>
                            <input type="date" id="workersReportFromDate" required>
                        </div>
                        <div class="form-group">
                            <label for="workersReportToDate">إلى تاريخ</label>
                            <input type="date" id="workersReportToDate" required>
                        </div>
                    </div>

                    <!-- اختيار العمال المتعدد -->
                    <div class="form-group">
                        <label for="workersReportWorkers">اختيار العمال</label>
                        <div class="workers-selection">
                            <div class="selection-display">
                                <div class="selected-workers-display" id="selectedWorkersDisplay">
                                    جميع العمال محددين
                                </div>
                                <button type="button" class="btn info" onclick="openWorkersSelectionModal()">
                                    <i class="fas fa-users"></i> اختيار متعدد
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- خيار إظهار الغياب -->
                    <div class="form-group">
                        <div class="toggle-option">
                            <div class="toggle-container">
                                <span class="toggle-text">إظهار أيام الغياب في التقرير</span>
                                <div class="checkbox-apple">
                                    <input type="checkbox" id="showAbsenceDays" class="yep">
                                    <label for="showAbsenceDays"></label>
                                </div>
                            </div>
                            <p class="toggle-description">
                                عند التفعيل: سيتم إظهار أيام الغياب. الغياب بدون تكاليف سيظهر بلون رمادي خفيف.
                            </p>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn success" onclick="generateWorkersReport()">
                            <i class="fas fa-chart-line"></i> إنشاء التقرير
                        </button>
                        <button class="btn info" onclick="printWorkersReport()" id="printWorkersReportBtn" style="display: none;">
                            <i class="fas fa-print"></i> طباعة التقرير
                        </button>
                        <button class="btn warning" onclick="printWorkersReportColored()" id="printWorkersReportColoredBtn" style="display: none;">
                            <i class="fas fa-palette"></i> طباعة ملونة
                        </button>
                        <button class="btn" onclick="hideWorkersReportModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </div>
                <div id="workersReportContent" class="report-content">
                    <!-- سيتم ملؤه بالتقرير -->
                </div>
            </div>
        </div>

        <!-- قائمة منبثقة لاختيار العمال -->
        <div id="workersSelectionModal" class="modal">
            <div class="modal-content large-modal workers-selection-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> اختيار العمال</h3>
                    <span class="close" onclick="closeWorkersSelectionModal()">&times;</span>
                </div>
                
                <!-- شريط البحث والتحكم -->
                <div class="workers-search-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="workersSearchInput" placeholder="البحث عن عامل..." onkeyup="searchWorkers()">
                        <button class="search-clear-btn" onclick="clearWorkersSearch()" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="workers-controls">
                        <button class="btn success select-all-btn" onclick="selectAllWorkersInModal()">
                            <i class="fas fa-check-circle"></i> تحديد الجميع
                        </button>
                        <button class="btn danger deselect-all-btn" onclick="deselectAllWorkersInModal()">
                            <i class="fas fa-times-circle"></i> إلغاء تحديد الجميع
                        </button>
                        <div class="workers-count-info">
                            <span id="selectedWorkersCount">0</span> من <span id="totalWorkersCount">0</span> محدد
                        </div>
                    </div>
                </div>

                <div class="workers-grid-container">
                    <div class="workers-grid" id="workersGrid">
                        <!-- سيتم ملؤها بالعمال -->
                    </div>
                    <div class="no-workers-found" id="noWorkersFound" style="display: none;">
                        <i class="fas fa-search"></i>
                        <p>لم يتم العثور على عمال مطابقين للبحث</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn success" onclick="confirmWorkersSelection()">
                        <i class="fas fa-check"></i> موافق
                    </button>
                    <button class="btn" onclick="closeWorkersSelectionModal()">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                </div>
            </div>
        </div>

        <!-- نموذج تقرير المعاليم -->
        <div id="foremenReportModal" class="modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-user-tie"></i> تقرير المعاليم</h3>
                    <span class="close" onclick="hideForemenReportModal()">&times;</span>
                </div>
                <div class="report-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="foremenReportFromDate">من تاريخ</label>
                            <input type="date" id="foremenReportFromDate" required>
                        </div>
                        <div class="form-group">
                            <label for="foremenReportToDate">إلى تاريخ</label>
                            <input type="date" id="foremenReportToDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="foremenReportForeman">المعلم (اختياري)</label>
                        <select id="foremenReportForeman">
                            <option value="">جميع المعاليم</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn success" onclick="generateForemenReport()">
                            <i class="fas fa-chart-line"></i> إنشاء التقرير
                        </button>
                        <button class="btn info" onclick="printForemenReport()" id="printForemenReportBtn" style="display: none;">
                            <i class="fas fa-print"></i> طباعة التقرير
                        </button>
                        <button class="btn warning" onclick="printForemenReportColored()" id="printForemenReportColoredBtn" style="display: none;">
                            <i class="fas fa-palette"></i> طباعة ملونة
                        </button>
                        <button class="btn" onclick="hideForemenReportModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </div>
                <div id="foremenReportContent" class="report-content">
                    <!-- سيتم ملؤه بالتقرير -->
                </div>
            </div>
        </div>

        <!-- نموذج تقرير مقاولين الباطن -->
        <div id="subcontractorsReportModal" class="modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-user-cog"></i> تقرير مقاولين الباطن</h3>
                    <span class="close" onclick="hideSubcontractorsReportModal()">&times;</span>
                </div>
                <div class="report-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="subcontractorsReportFromDate">من تاريخ</label>
                            <input type="date" id="subcontractorsReportFromDate" required>
                        </div>
                        <div class="form-group">
                            <label for="subcontractorsReportToDate">إلى تاريخ</label>
                            <input type="date" id="subcontractorsReportToDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="subcontractorsReportSubcontractor">مقاول الباطن (اختياري)</label>
                        <select id="subcontractorsReportSubcontractor">
                            <option value="">جميع مقاولين الباطن</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn success" onclick="generateSubcontractorsReport()">
                            <i class="fas fa-chart-line"></i> إنشاء التقرير
                        </button>
                        <button class="btn info" onclick="printSubcontractorsReport()" id="printSubcontractorsReportBtn" style="display: none;">
                            <i class="fas fa-print"></i> طباعة التقرير
                        </button>
                        <button class="btn warning" onclick="printSubcontractorsReportColored()" id="printSubcontractorsReportColoredBtn" style="display: none;">
                            <i class="fas fa-palette"></i> طباعة ملونة
                        </button>
                        <button class="btn" onclick="hideSubcontractorsReportModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </div>
                <div id="subcontractorsReportContent" class="report-content">
                    <!-- سيتم ملؤه بالتقرير -->
                </div>
            </div>
        </div>

        <!-- نموذج تقرير الإجمالي لكل العمال -->
        <div id="allWorkersReportModal" class="modal">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> الإجمالي لكل العمال</h3>
                    <span class="close" onclick="hideAllWorkersReportModal()">&times;</span>
                </div>
                <div class="report-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="allWorkersReportFromDate">من تاريخ</label>
                            <input type="date" id="allWorkersReportFromDate" required>
                        </div>
                        <div class="form-group">
                            <label for="allWorkersReportToDate">إلى تاريخ</label>
                            <input type="date" id="allWorkersReportToDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="includeInactiveWorkers">
                            تضمين العمال غير النشطين
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button class="btn success" onclick="generateAllWorkersReport()">
                            <i class="fas fa-chart-line"></i> إنشاء التقرير
                        </button>
                        <button class="btn info" onclick="printAllWorkersReport()" id="printAllWorkersReportBtn" style="display: none;">
                            <i class="fas fa-print"></i> طباعة التقرير
                        </button>
                        <button class="btn warning" onclick="printAllWorkersReportColored()" id="printAllWorkersReportColoredBtn" style="display: none;">
                            <i class="fas fa-palette"></i> طباعة ملونة
                        </button>
                        <button class="btn" onclick="hideAllWorkersReportModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </div>
                <div id="allWorkersReportContent" class="report-content">
                    <!-- سيتم ملؤه بالتقرير -->
                </div>
            </div>
        </div>
    `;
}

// دوال التقارير

// إظهار نموذج تقرير العمال
function showWorkersReportForm() {
    const modal = document.getElementById('workersReportModal');
    modal.style.display = 'block';

    // تحميل قائمة العمال للاختيار المتعدد
    loadWorkersSelectionList();

    // تعيين التواريخ الافتراضية (الشهر الحالي)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('workersReportFromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('workersReportToDate').value = today.toISOString().split('T')[0];
}

// متغير لحفظ العمال المحددين
let selectedWorkerIds = [];

// تحميل قائمة العمال للاختيار المتعدد
function loadWorkersSelectionList() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);

    // تحديد جميع العمال افتراضياً
    selectedWorkerIds = contractorWorkers.map(w => w.id);
    updateSelectedWorkersDisplay();
}

// فتح قائمة اختيار العمال المنبثقة
function openWorkersSelectionModal() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);
    
    // التأكد من أن جميع العمال محددين افتراضياً
    if (selectedWorkerIds.length === 0) {
        selectedWorkerIds = contractorWorkers.map(w => w.id);
    }

    // مسح البحث
    const searchInput = document.getElementById('workersSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    // تحديث عدد العمال
    updateWorkersCount(contractorWorkers);
    
    // عرض العمال
    displayWorkersInGrid(contractorWorkers);
    
    document.getElementById('workersSelectionModal').style.display = 'block';
}

// عرض العمال في الشبكة
function displayWorkersInGrid(workers) {
    const gridContainer = document.getElementById('workersGrid');
    const noWorkersFound = document.getElementById('noWorkersFound');

    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (workers.length === 0) {
        gridContainer.style.display = 'none';
        noWorkersFound.style.display = 'block';
        return;
    }

    gridContainer.style.display = 'grid';
    noWorkersFound.style.display = 'none';

    workers.forEach(worker => {
        const workerCard = document.createElement('div');
        workerCard.className = `worker-card ${selectedWorkerIds.includes(worker.id) ? 'selected' : ''}`;
        workerCard.setAttribute('data-worker-id', worker.id);
        workerCard.setAttribute('data-worker-name', worker.name.toLowerCase());
        workerCard.setAttribute('data-worker-number', (worker.workerNumber || '').toString().toLowerCase());

        workerCard.innerHTML = `
            <div class="worker-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="worker-info">
                <div class="worker-name">${worker.name}</div>
                <div class="worker-number">${worker.workerNumber || 'بدون رقم'}</div>
                <div class="worker-specialty">${worker.specialty || 'عام'}</div>
            </div>
            <div class="selection-indicator">
                <i class="fas fa-check"></i>
            </div>
        `;

        workerCard.addEventListener('click', () => toggleWorkerSelection(worker.id, workerCard));
        gridContainer.appendChild(workerCard);
    });

    updateWorkersCount();
}

// البحث في العمال
function searchWorkers() {
    const searchInput = document.getElementById('workersSearchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const clearBtn = document.querySelector('.search-clear-btn');
    
    // إظهار/إخفاء زر المسح
    if (searchTerm) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }

    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);

    if (!searchTerm) {
        displayWorkersInGrid(contractorWorkers);
        return;
    }

    // تصفية العمال حسب البحث
    const filteredWorkers = contractorWorkers.filter(worker => {
        const name = worker.name.toLowerCase();
        const number = (worker.workerNumber || '').toString().toLowerCase();
        const specialty = (worker.specialty || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               number.includes(searchTerm) || 
               specialty.includes(searchTerm);
    });

    displayWorkersInGrid(filteredWorkers);
}

// مسح البحث
function clearWorkersSearch() {
    const searchInput = document.getElementById('workersSearchInput');
    const clearBtn = document.querySelector('.search-clear-btn');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    
    searchWorkers(); // إعادة عرض جميع العمال
}

// تحديد جميع العمال في النافذة المنبثقة
function selectAllWorkersInModal() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);
    
    selectedWorkerIds = contractorWorkers.map(w => w.id);

    // تحديث جميع البطاقات في النافذة
    const workerCards = document.querySelectorAll('.worker-card');
    workerCards.forEach(card => {
        card.classList.add('selected');
    });

    updateWorkersCount();
}

// تحديث عدد العمال المحددين
function updateWorkersCount(allWorkers = null) {
    const selectedCountElement = document.getElementById('selectedWorkersCount');
    const totalCountElement = document.getElementById('totalWorkersCount');
    
    if (!selectedCountElement || !totalCountElement) return;

    if (!allWorkers) {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        allWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);
    }

    const visibleCards = document.querySelectorAll('.worker-card:not([style*="display: none"])');
    const selectedCount = selectedWorkerIds.length;
    
    selectedCountElement.textContent = selectedCount;
    totalCountElement.textContent = allWorkers.length;
}

// تبديل تحديد العامل
function toggleWorkerSelection(workerId, cardElement) {
    if (selectedWorkerIds.includes(workerId)) {
        // إلغاء التحديد
        selectedWorkerIds = selectedWorkerIds.filter(id => id !== workerId);
        cardElement.classList.remove('selected');
    } else {
        // إضافة التحديد
        selectedWorkerIds.push(workerId);
        cardElement.classList.add('selected');
    }
    
    updateWorkersCount();
}

// إلغاء تحديد جميع العمال في النافذة المنبثقة
function deselectAllWorkersInModal() {
    selectedWorkerIds = [];

    // تحديث جميع البطاقات في النافذة
    const workerCards = document.querySelectorAll('.worker-card');
    workerCards.forEach(card => {
        card.classList.remove('selected');
    });

    updateWorkersCount();
}

// تأكيد اختيار العمال
function confirmWorkersSelection() {
    updateSelectedWorkersDisplay();
    closeWorkersSelectionModal();
}

// إغلاق قائمة اختيار العمال
function closeWorkersSelectionModal() {
    document.getElementById('workersSelectionModal').style.display = 'none';
}

// تحديث عرض العمال المحددين
function updateSelectedWorkersDisplay() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const displayElement = document.getElementById('selectedWorkersDisplay');

    if (!displayElement) return;

    if (selectedWorkerIds.length === 0) {
        displayElement.textContent = 'لم يتم اختيار أي عامل';
        displayElement.style.color = '#dc3545';
    } else {
        const contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.active);

        if (selectedWorkerIds.length === contractorWorkers.length) {
            displayElement.textContent = 'جميع العمال محددين';
        } else {
            const selectedNames = workers
                .filter(w => selectedWorkerIds.includes(w.id))
                .map(w => w.name)
                .slice(0, 3);

            if (selectedWorkerIds.length > 3) {
                displayElement.textContent = `${selectedNames.join(', ')} و ${selectedWorkerIds.length - 3} آخرين`;
            } else {
                displayElement.textContent = selectedNames.join(', ');
            }
        }
        displayElement.style.color = '#28a745';
    }
}

// الحصول على العمال المحددين
function getSelectedWorkers() {
    return selectedWorkerIds;
}

// إعداد أحداث القائمة المنبثقة
document.addEventListener('DOMContentLoaded', function() {
    // إغلاق القائمة عند النقر خارجها
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('workersSelectionModal');
        if (e.target === modal) {
            closeWorkersSelectionModal();
        }
    });
});

// إخفاء نموذج تقرير العمال
function hideWorkersReportModal() {
    document.getElementById('workersReportModal').style.display = 'none';
    document.getElementById('workersReportContent').innerHTML = '';
    document.getElementById('printWorkersReportBtn').style.display = 'none';
}

// إنشاء تقرير العمال
function generateWorkersReport() {
    const fromDate = document.getElementById('workersReportFromDate').value;
    const toDate = document.getElementById('workersReportToDate').value;
    const selectedWorkerIds = getSelectedWorkers();
    const showAbsence = document.getElementById('showAbsenceDays').checked;

    if (!fromDate || !toDate) {
        alert('الرجاء تحديد الفترة الزمنية');
        return;
    }

    if (selectedWorkerIds.length === 0) {
        alert('الرجاء اختيار عامل واحد على الأقل');
        return;
    }

    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    // تصفية العمال حسب الاختيار المتعدد
    const reportWorkers = workers.filter(w =>
        w.contractorId === currentContractor.id &&
        selectedWorkerIds.includes(w.id)
    );

    // تصفية الحضور حسب التاريخ
    const reportAttendance = attendance.filter(a => {
        const attendanceDate = new Date(a.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return attendanceDate >= from && attendanceDate <= to;
    });

    let reportHTML = `
        <div class="report-header">
            <h2>تقرير العمال</h2>
            <p>من ${new Date(fromDate).toLocaleDateString('ar')} إلى ${new Date(toDate).toLocaleDateString('ar')}</p>
            <p>المقاول: ${currentContractor.name}</p>
        </div>
    `;

    let grandTotal = 0;
    let grandTotalAdvances = 0;
    let grandTotalSmokingCosts = 0;
    let grandTotalWorkDays = 0;
    let grandTotalOvertimeHours = 0;

    reportWorkers.forEach(worker => {
        const workerAttendance = reportAttendance.filter(a => a.workerId === worker.id);
        const workshop = workshops.find(w => w.id === worker.workshopId);

        let workerTotal = 0;
        let totalDays = 0;
        let totalOvertimeHours = 0;
        let totalAdvances = 0;
        let totalSmokingCosts = 0;

        reportHTML += `
            <div class="worker-report-section">
                <h3>${worker.name} - ${worker.workerNumber || '#'}</h3>
                <p><strong>الورشة:</strong> ${workshop ? workshop.name : 'غير محدد'}</p>
                <p><strong>اليومية الأساسية:</strong> ${worker.dailyWage} ₪</p>

                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>الورشة</th>
                            <th>اليومية</th>
                            <th>يوم عمل</th>
                            <th>ساعات إضافية</th>
                            <th>سعر الساعة الإضافية</th>
                            <th>سلف</th>
                            <th>تكاليف دخان</th>
                            <th>صافي اليومية</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // إنشاء قائمة بجميع التواريخ في الفترة
        const allDates = [];
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            allDates.push(new Date(d).toISOString().split('T')[0]);
        }

        // معالجة كل تاريخ
        allDates.forEach(date => {
            const record = workerAttendance.find(a => a.date === date);

            if (record) {
                // يوجد سجل حضور
                const netDaily = calculateNetDaily(
                    record.dailyWage || worker.dailyWage,
                    record.workDay || 0,
                    record.overtimeHours || 0,
                    record.overtimeRate || worker.overtimeRate,
                    record.advance || 0,
                    record.smokingCosts || 0
                );

                workerTotal += netDaily;
                totalDays += record.workDay || 0;
                totalOvertimeHours += record.overtimeHours || 0;
                totalAdvances += record.advance || 0;
                totalSmokingCosts += record.smokingCosts || 0;

                const statusText = record.status === 'present' ? 'حاضر' : 'غائب';
                
                // تحديد classes للتلوين
                let rowClass = '';
                let workDayClass = '';
                let overtimeClass = '';
                let overtimeRateClass = '';
                let advanceClass = '';
                let smokingClass = '';
                let netDailyClass = '';
                
                if (record.status === 'absent') {
                    // غائب
                    if (record.advance > 0 || record.smokingCosts > 0) {
                        rowClass = 'absence-with-costs';
                    } else {
                        rowClass = 'absence-no-costs';
                    }
                    // سعر الساعة رمادي للغياب
                    overtimeRateClass = 'absence-overtime-rate';
                } else {
                    // حاضر - سعر الساعة بدون تنسيق (عادي)
                    overtimeRateClass = '';
                }
                
                // يوم عمل صفر
                if ((record.workDay || 0) === 0) {
                    workDayClass = 'zero-work-day';
                }
                
                // ساعات إضافية
                if ((record.overtimeHours || 0) > 0) {
                    overtimeClass = 'overtime-hours';
                }

                // صافي اليومية - تحديد اللون حسب القيمة
                if (netDaily < 0) {
                    netDailyClass = 'negative-daily';
                } else {
                    netDailyClass = '';
                }

                // الحصول على الورشة من سجل الحضور
                console.log('📊 التقرير - سجل الحضور:', record);
                console.log('🏗️ التقرير - معرف الورشة:', record.workshopId, 'نوع البيانات:', typeof record.workshopId);
                console.log('🏗️ التقرير - قائمة الورش:', workshops);

                // البحث بكلا النوعين (string و number)
                const recordWorkshop = workshops.find(w => w.id == record.workshopId || w.id === parseInt(record.workshopId));
                const workshopName = recordWorkshop ? recordWorkshop.name : '-';
                console.log('🏗️ التقرير - الورشة الموجودة:', recordWorkshop);
                console.log('🏗️ التقرير - اسم الورشة:', workshopName);

                reportHTML += `
                    <tr class="${rowClass}">
                        <td>${new Date(record.date).toLocaleDateString('ar')}</td>
                        <td>${statusText}</td>
                        <td>${workshopName}</td>
                        <td>${record.dailyWage || worker.dailyWage} ₪</td>
                        <td class="${workDayClass}">${record.workDay || 0}</td>
                        <td class="${overtimeClass}">${record.overtimeHours || 0}</td>
                        <td class="${overtimeRateClass}">${record.overtimeRate || worker.overtimeRate} ₪</td>
                        <td>${record.advance || 0} ₪</td>
                        <td>${record.smokingCosts || 0} ₪</td>
                        <td class="${netDailyClass}">${netDaily.toFixed(2)} ₪</td>
                    </tr>
                `;
            } else if (showAbsence) {
                // لا يوجد سجل حضور وخيار إظهار الغياب مفعل
                reportHTML += `
                    <tr class="absence-no-costs">
                        <td>${new Date(date).toLocaleDateString('ar')}</td>
                        <td>غائب</td>
                        <td>-</td>
                        <td>-</td>
                        <td class="zero-work-day">0</td>
                        <td>0</td>
                        <td class="absence-overtime-rate">-</td>
                        <td>0 ₪</td>
                        <td>0 ₪</td>
                        <td>0 ₪</td>
                    </tr>
                `;
            }
        });

        reportHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3"><strong>الإجمالي</strong></td>
                            <td><strong>-</strong></td>
                            <td><strong>${totalDays}</strong></td>
                            <td class="${totalOvertimeHours > 0 ? 'total-overtime' : ''}"><strong>${totalOvertimeHours}</strong></td>
                            <td class="${totalOvertimeHours > 0 ? 'total-overtime' : ''}"><strong>-</strong></td>
                            <td><strong>${totalAdvances.toFixed(2)} ₪</strong></td>
                            <td><strong>${totalSmokingCosts.toFixed(2)} ₪</strong></td>
                            <td class="total-net-daily"><strong>${workerTotal.toFixed(2)} ₪</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        grandTotal += workerTotal;
        grandTotalAdvances += totalAdvances;
        grandTotalSmokingCosts += totalSmokingCosts;
        grandTotalWorkDays += totalDays;
        grandTotalOvertimeHours += totalOvertimeHours;
    });

    reportHTML += `
        <div class="report-summary">
            <h3>ملخص التقرير العام</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">إجمالي المدفوعات:</span>
                    <span class="summary-value">${grandTotal.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي السلف:</span>
                    <span class="summary-value">${grandTotalAdvances.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي تكاليف الدخان:</span>
                    <span class="summary-value">${grandTotalSmokingCosts.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي أيام العمل:</span>
                    <span class="summary-value">${grandTotalWorkDays.toFixed(1)} يوم</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي الساعات الإضافية:</span>
                    <span class="summary-value">${grandTotalOvertimeHours.toFixed(1)} ساعة</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">عدد العمال:</span>
                    <span class="summary-value">${reportWorkers.length}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">تاريخ إنشاء التقرير:</span>
                    <span class="summary-value">${new Date().toLocaleDateString('ar')}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('workersReportContent').innerHTML = reportHTML;
    document.getElementById('printWorkersReportBtn').style.display = 'inline-block';
    document.getElementById('printWorkersReportColoredBtn').style.display = 'inline-block';
}

// طباعة تقرير العمال
function printWorkersReport() {
    const reportContent = document.getElementById('workersReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير العمال</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// طباعة تقرير العمال ملونة
function printWorkersReportColored() {
    const reportContent = document.getElementById('workersReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير العمال - طباعة ملونة</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }

                    /* تلوين السلف - برتقالي */
                    .report-table td:nth-child(8) { /* السلف */
                        background-color: #fff3e0 !important;
                        color: #f57c00 !important;
                    }

                    /* تلوين الدخان - برتقالي */
                    .report-table td:nth-child(9) { /* الدخان */
                        background-color: #fff3e0 !important;
                        color: #f57c00 !important;
                    }

                    /* صافي اليومية السالبة - أحمر */
                    .negative-daily {
                        background-color: #ffebee !important;
                        color: #d32f2f !important;
                        font-weight: bold !important;
                    }

                    /* تلوين صافي اليومية - أخضر فاتح */
                    .report-table td:nth-child(10) { /* صافي اليومية */
                        background-color: #e8f5e8 !important;
                        color: #2e7d32 !important;
                        font-weight: bold !important;
                    }

                    /* إجمالي صافي اليومية - أخضر غامق مع إطار غليظ */
                    .total-net-daily {
                        background-color: #1b5e20 !important;
                        color: white !important;
                        font-weight: bold !important;
                        border: 4px solid #1b5e20 !important;
                        box-shadow: 0 0 8px rgba(27, 94, 32, 0.5) !important;
                    }

                    /* سعر الساعة للغياب - رمادي */
                    .absence-overtime-rate {
                        color: #999999 !important;
                        background-color: #f5f5f5 !important;
                    }

                    /* أيام الغياب بدون سلف أو دخان - رمادي للسطر كله */
                    .absence-no-costs { 
                        background-color: #f5f5f5 !important; 
                        color: #666666 !important;
                    }
                    
                    .absence-no-costs td {
                        background-color: #f5f5f5 !important; 
                        color: #666666 !important;
                    }

                    /* أيام العمل صفر - نص رمادي */
                    .zero-work-day {
                        color: #999999 !important;
                    }

                    /* الساعات الإضافية - أزرق */
                    .overtime-hours {
                        color: #1976d2 !important;
                        font-weight: bold !important;
                    }

                    /* إجمالي السلف - برتقالي */
                    .total-row td:nth-child(8) { /* إجمالي السلف */
                        background-color: #ff9800 !important;
                        color: white !important;
                        font-weight: bold !important;
                    }

                    /* إجمالي الدخان - برتقالي */
                    .total-row td:nth-child(9) { /* إجمالي الدخان */
                        background-color: #ff9800 !important;
                        color: white !important;
                        font-weight: bold !important;
                    }

                    /* إجمالي صافي اليومية - أخضر غامق */
                    .total-row td:nth-child(10) { /* إجمالي صافي اليومية */
                        background-color: #4cb91c !important;
                        color: white !important;
                        font-weight: bold !important;
                    }

                    /* إجمالي صافي اليومية - أخضر غامق مع إطار غليظ */
                    .total-net-daily {
                        background-color: #4cb91c !important;
                        color: white !important;
                        font-weight: bold !important;
                        border: 4px solid #4cb91c !important;
                        box-shadow: 0 0 8px rgba(76, 185, 28, 0.5) !important;
                    }

                    /* إجمالي الساعات الإضافية - أزرق */
                    .total-overtime {
                        color: #0d47a1 !important;
                        font-weight: bold !important;
                    }



                    /* تصغير رمز الشيكل */
                    .report-table td:not(.total-row td) {
                        font-size: 0.9rem !important;
                    }
                    .report-table td:not(.total-row td) .currency {
                        font-size: 0.7rem !important;
                        opacity: 0.7;
                    }

                    /* تكبير اسم العامل مع ظل */
                    .worker-report-section h3 {
                        font-size: 1.5rem !important;
                        font-weight: bold !important;
                        color: #2c3e50 !important;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3) !important;
                        margin-bottom: 0.5rem !important;
                    }

                    /* تصغير معلومات الورشة واليومية */
                    .worker-report-section p {
                        font-size: 0.85rem !important;
                        color: #6c757d !important;
                        margin: 0.25rem 0 !important;
                    }

                    /* تلوين مجموع السلف والدخان في الملخص - برتقالي */
                    .summary-item:contains('إجمالي السلف') .summary-value,
                    .summary-item:contains('إجمالي تكاليف الدخان') .summary-value {
                        background-color: #ff9800 !important;
                        color: white !important;
                        padding: 0.25rem 0.5rem !important;
                        border-radius: 4px !important;
                        font-weight: bold !important;
                    }

                    /* تلوين مجموع صافي اليومية في الملخص - أخضر غامق */
                    .summary-item:contains('إجمالي المدفوعات') .summary-value {
                        background-color: #4cb91c !important;
                        color: white !important;
                        padding: 0.25rem 0.5rem !important;
                        border-radius: 4px !important;
                        font-weight: bold !important;
                    }

                    /* تلوين إجمالي الساعات الإضافية - أزرق */
                    .summary-item:contains('إجمالي الساعات الإضافية') .summary-value {
                        background-color: #0d47a1 !important;
                        color: white !important;
                        padding: 0.25rem 0.5rem !important;
                        border-radius: 4px !important;
                        font-weight: bold !important;
                    }

                    @media print {
                        body { margin: 0; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    }
                </style>
                <script>
                    window.onload = function() {
                        // تصغير رمز الشيكل في جميع الخلايا ما عدا الإجمالي
                        const allCells = document.querySelectorAll('.report-table td');
                        allCells.forEach(cell => {
                            if (!cell.closest('tr').classList.contains('total-row')) {
                                cell.innerHTML = cell.innerHTML.replace(/₪/g, '<span class="currency">₪</span>');
                            }
                        });

                        // تلوين الأرقام السالبة
                        const cells = document.querySelectorAll('.report-table td');
                        cells.forEach(cell => {
                            if (cell.textContent.includes('-') && cell.textContent.includes('₪')) {
                                cell.style.backgroundColor = '#ffebee';
                                cell.style.color = '#c62828';
                            }
                        });

                        // تلوين حالة الحضور
                        const statusCells = document.querySelectorAll('.report-table td:nth-child(2)');
                        statusCells.forEach(cell => {
                            if (cell.textContent.trim() === 'حاضر') {
                                cell.style.backgroundColor = '#e8f5e8';
                                cell.style.color = '#2e7d32';
                                cell.style.fontWeight = 'bold';
                            }
                        });

                        // تلوين صافي اليومية الموجب بأخضر أغمق شوي
                        const netDailyCells = document.querySelectorAll('.report-table td:nth-child(9)');
                        netDailyCells.forEach(cell => {
                            const value = parseFloat(cell.textContent.replace(/[^\d.-]/g, ''));
                            if (value > 0 && !cell.closest('tr').classList.contains('total-row')) {
                                cell.style.backgroundColor = '#d4edda';
                                cell.style.color = '#155724';
                                cell.style.fontWeight = 'bold';
                            }
                        });

                        // تلوين الغياب مع تكاليف فقط
                        const rows = document.querySelectorAll('.report-table tbody tr');
                        rows.forEach(row => {
                            const statusCell = row.querySelector('td:nth-child(2)');
                            const advanceCell = row.querySelector('td:nth-child(7)');
                            const smokingCell = row.querySelector('td:nth-child(8)');

                            if (statusCell && statusCell.textContent.trim() === 'غائب') {
                                const advance = parseFloat(advanceCell?.textContent.replace(/[^\d.-]/g, '') || 0);
                                const smoking = parseFloat(smokingCell?.textContent.replace(/[^\d.-]/g, '') || 0);

                                // تلوين فقط إذا كان فيه سلف أو دخان
                                if (advance > 0 || smoking > 0) {
                                    row.style.backgroundColor = '#ffebee';
                                    row.style.color = '#c62828';
                                }
                            }
                        });

                        // تلوين إجمالي صافي اليومية بالأخضر المحدد
                        const totalRows = document.querySelectorAll('.total-row');
                        totalRows.forEach(row => {
                            const netDailyCell = row.querySelector('td:nth-child(9)');
                            if (netDailyCell) {
                                netDailyCell.style.backgroundColor = 'rgb(55, 153, 0)';
                                netDailyCell.style.color = 'white';
                                netDailyCell.style.fontWeight = 'bold';
                            }

                            // تلوين إجمالي السلف بالبرتقالي المحدد
                            const advanceCell = row.querySelector('td:nth-child(7)');
                            if (advanceCell) {
                                advanceCell.style.backgroundColor = 'rgb(255, 152, 0)';
                                advanceCell.style.color = 'white';
                                advanceCell.style.fontWeight = 'bold';
                            }
                        });

                        // تلوين القيم في الملخص
                        const summaryItems = document.querySelectorAll('.summary-item');
                        summaryItems.forEach(item => {
                            const label = item.querySelector('.summary-label');
                            const value = item.querySelector('.summary-value');

                            if (label && value) {
                                // تلوين إجمالي السلف بالبرتقالي المحدد
                                if (label.textContent.includes('إجمالي السلف') ||
                                    label.textContent.includes('إجمالي تكاليف الدخان')) {
                                    value.style.backgroundColor = 'rgb(255, 152, 0)';
                                    value.style.color = 'white';
                                    value.style.padding = '0.25rem 0.5rem';
                                    value.style.borderRadius = '4px';
                                    value.style.fontWeight = 'bold';
                                }

                                // تلوين إجمالي المدفوعات بالأخضر المحدد
                                if (label.textContent.includes('إجمالي المدفوعات')) {
                                    value.style.backgroundColor = 'rgb(55, 153, 0)';
                                    value.style.color = 'white';
                                    value.style.padding = '0.25rem 0.5rem';
                                    value.style.borderRadius = '4px';
                                    value.style.fontWeight = 'bold';
                                }

                                // تلوين القيم السالبة
                                if (value.textContent.includes('-')) {
                                    value.style.backgroundColor = '#ffebee';
                                    value.style.color = '#c62828';
                                    value.style.padding = '0.25rem 0.5rem';
                                    value.style.borderRadius = '4px';
                                }
                            }
                        });
                    };
                </script>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// إظهار نموذج تقرير المعاليم
function showForemenReportForm() {
    const modal = document.getElementById('foremenReportModal');
    modal.style.display = 'block';

    // تحميل قائمة المعاليم
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const contractorForemen = foremen.filter(f => f.contractorId === currentContractor.id);
    const select = document.getElementById('foremenReportForeman');

    select.innerHTML = '<option value="">جميع المعاليم</option>';
    contractorForemen.forEach(foreman => {
        const option = document.createElement('option');
        option.value = foreman.id;
        option.textContent = foreman.name;
        select.appendChild(option);
    });

    // تعيين التواريخ الافتراضية
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('foremenReportFromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('foremenReportToDate').value = today.toISOString().split('T')[0];
}

// إخفاء نموذج تقرير المعاليم
function hideForemenReportModal() {
    document.getElementById('foremenReportModal').style.display = 'none';
    document.getElementById('foremenReportContent').innerHTML = '';
    document.getElementById('printForemenReportBtn').style.display = 'none';
}

// إنشاء تقرير المعاليم
function generateForemenReport() {
    const fromDate = document.getElementById('foremenReportFromDate').value;
    const toDate = document.getElementById('foremenReportToDate').value;
    const selectedForemanId = document.getElementById('foremenReportForeman').value;

    if (!fromDate || !toDate) {
        alert('الرجاء تحديد الفترة الزمنية');
        return;
    }

    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    // تصفية المعاليم
    let reportForemen = foremen.filter(f => f.contractorId === currentContractor.id);
    if (selectedForemanId) {
        reportForemen = reportForemen.filter(f => f.id == selectedForemanId);
    }

    // تصفية المصاريف حسب التاريخ
    const reportExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return expenseDate >= from && expenseDate <= to;
    });

    let reportHTML = `
        <div class="report-header">
            <h2>تقرير المعاليم</h2>
            <p>من ${new Date(fromDate).toLocaleDateString('ar')} إلى ${new Date(toDate).toLocaleDateString('ar')}</p>
            <p>المقاول: ${currentContractor.name}</p>
        </div>
    `;

    let grandTotal = 0;

    reportForemen.forEach(foreman => {
        const foremanExpenses = reportExpenses.filter(e => e.foremanId === foreman.id);
        const workshop = workshops.find(w => w.id === foreman.workshopId);

        let foremanTotal = 0;

        reportHTML += `
            <div class="worker-report-section">
                <h3>${foreman.name} - ${foreman.specialty}</h3>
                <p><strong>الورشة:</strong> ${workshop ? workshop.name : 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> ${foreman.phone || 'غير محدد'}</p>

                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>وصف المصروف</th>
                            <th>المبلغ</th>
                            <th>الورشة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        foremanExpenses.forEach(expense => {
            const expenseWorkshop = workshops.find(w => w.id === expense.workshopId);
            foremanTotal += expense.amount;

            reportHTML += `
                <tr>
                    <td>${new Date(expense.date).toLocaleDateString('ar')}</td>
                    <td>${expense.description}</td>
                    <td>${expense.amount.toLocaleString()} ₪</td>
                    <td>${expenseWorkshop ? expenseWorkshop.name : '-'}</td>
                    <td>${expense.notes || '-'}</td>
                </tr>
            `;
        });

        reportHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="2"><strong>الإجمالي</strong></td>
                            <td><strong>${foremanTotal.toLocaleString()} ₪</strong></td>
                            <td colspan="2"><strong>-</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        grandTotal += foremanTotal;
    });

    reportHTML += `
        <div class="report-summary">
            <h3>ملخص التقرير</h3>
            <p><strong>إجمالي مصاريف المعاليم:</strong> ${grandTotal.toLocaleString()} ₪</p>
            <p><strong>عدد المعاليم:</strong> ${reportForemen.length}</p>
            <p><strong>تاريخ إنشاء التقرير:</strong> ${new Date().toLocaleDateString('ar')}</p>
        </div>
    `;

    document.getElementById('foremenReportContent').innerHTML = reportHTML;
    document.getElementById('printForemenReportBtn').style.display = 'inline-block';
    document.getElementById('printForemenReportColoredBtn').style.display = 'inline-block';
}

// طباعة تقرير المعاليم
function printForemenReport() {
    const reportContent = document.getElementById('foremenReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير المعاليم</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// طباعة تقرير المعاليم ملونة
function printForemenReportColored() {
    const reportContent = document.getElementById('foremenReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير المعاليم - طباعة ملونة</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }

                    /* تلوين المصاريف - أحمر فاتح */
                    .report-table td:nth-child(3) { /* المبلغ */
                        background-color: #ffebee !important;
                        color: #d32f2f !important;
                    }

                    /* أيام بدون مصاريف - رمادي للسطر كله */
                    .no-expenses { 
                        background-color: #f5f5f5 !important; 
                        color: #666666 !important;
                    }
                    
                    .no-expenses td {
                        background-color: #f5f5f5 !important; 
                        color: #666666 !important;
                    }

                    /* صفوف الإجمالي - أحمر غامق للمصاريف */
                    .total-row { 
                        background-color: #b71c1c !important;
                        color: white !important;
                        font-weight: bold !important;
                    }

                    /* تكبير اسم المعلم مع ظل */
                    .worker-report-section h3 {
                        font-size: 1.5rem !important;
                        font-weight: bold !important;
                        color: #2c3e50 !important;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3) !important;
                        margin-bottom: 0.5rem !important;
                    }

                    /* تصغير معلومات إضافية */
                    .worker-report-section p {
                        font-size: 0.85rem !important;
                        color: #6c757d !important;
                        margin: 0.25rem 0 !important;
                    }

                    @media print {
                        body { margin: 0; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    }
                </style>
                <script>
                    window.onload = function() {
                        // تلوين الأرقام السالبة
                        const cells = document.querySelectorAll('.report-table td');
                        cells.forEach(cell => {
                            if (cell.textContent.includes('-') && cell.textContent.includes('₪')) {
                                cell.style.backgroundColor = '#ffebee';
                                cell.style.color = '#c62828';
                            }
                        });
                    };
                </script>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// إظهار نموذج تقرير مقاولين الباطن
function showSubcontractorsReportForm() {
    const modal = document.getElementById('subcontractorsReportModal');
    modal.style.display = 'block';

    // تحميل قائمة مقاولين الباطن
    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const contractorSubcontractors = subcontractors.filter(s => s.contractorId === currentContractor.id);
    const select = document.getElementById('subcontractorsReportSubcontractor');

    select.innerHTML = '<option value="">جميع مقاولين الباطن</option>';
    contractorSubcontractors.forEach(subcontractor => {
        const option = document.createElement('option');
        option.value = subcontractor.id;
        option.textContent = subcontractor.name;
        select.appendChild(option);
    });

    // تعيين التواريخ الافتراضية
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('subcontractorsReportFromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('subcontractorsReportToDate').value = today.toISOString().split('T')[0];
}

// إخفاء نموذج تقرير مقاولين الباطن
function hideSubcontractorsReportModal() {
    document.getElementById('subcontractorsReportModal').style.display = 'none';
    document.getElementById('subcontractorsReportContent').innerHTML = '';
    document.getElementById('printSubcontractorsReportBtn').style.display = 'none';
}

// إنشاء تقرير مقاولين الباطن
function generateSubcontractorsReport() {
    const fromDate = document.getElementById('subcontractorsReportFromDate').value;
    const toDate = document.getElementById('subcontractorsReportToDate').value;
    const selectedSubcontractorId = document.getElementById('subcontractorsReportSubcontractor').value;

    if (!fromDate || !toDate) {
        alert('الرجاء تحديد الفترة الزمنية');
        return;
    }

    const subcontractors = JSON.parse(localStorage.getItem('subcontractors')) || [];
    const jobs = JSON.parse(localStorage.getItem('subcontractorJobs')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const additionalCosts = JSON.parse(localStorage.getItem('additionalCosts')) || [];

    // تصفية مقاولين الباطن
    let reportSubcontractors = subcontractors.filter(s => s.contractorId === currentContractor.id);
    if (selectedSubcontractorId) {
        reportSubcontractors = reportSubcontractors.filter(s => s.id == selectedSubcontractorId);
    }

    // تصفية الطقات حسب التاريخ
    const reportJobs = jobs.filter(j => {
        const jobDate = new Date(j.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return jobDate >= from && jobDate <= to;
    });

    let reportHTML = `
        <div class="report-header">
            <h2>تقرير مقاولين الباطن</h2>
            <p>من ${new Date(fromDate).toLocaleDateString('ar')} إلى ${new Date(toDate).toLocaleDateString('ar')}</p>
            <p>المقاول: ${currentContractor.name}</p>
        </div>
    `;

    let grandTotal = 0;
    let grandJobsTotal = 0;
    let grandCostsTotal = 0;

    reportSubcontractors.forEach(subcontractor => {
        const subcontractorJobs = reportJobs.filter(j => j.subcontractorId === subcontractor.id);
        const workshop = workshops.find(w => w.id === subcontractor.workshopId);

        // تصفية التكاليف الإضافية لهذا المقاول في الفترة المحددة
        const subcontractorCosts = additionalCosts.filter(cost => {
            const costDate = new Date(cost.date);
            const from = new Date(fromDate);
            const to = new Date(toDate);
            return cost.subcontractorId === subcontractor.id &&
                   cost.contractorId === currentContractor.id &&
                   costDate >= from && costDate <= to;
        });

        let subcontractorJobsTotal = 0;
        let subcontractorCostsTotal = 0;

        reportHTML += `
            <div class="worker-report-section">
                <h3>${subcontractor.name} - ${subcontractor.specialty}</h3>
                <p><strong>الورشة:</strong> ${workshop ? workshop.name : 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> ${subcontractor.phone || 'غير محدد'}</p>
                <p><strong>العنوان:</strong> ${subcontractor.address || 'غير محدد'}</p>

                <!-- جدول الطقات -->
                <h4>طقات المقاولة</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>وصف المقاولة</th>
                            <th>سعر المقاولة</th>
                            <th>الورشة</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        subcontractorJobs.forEach(job => {
            const jobWorkshop = workshops.find(w => w.id === job.workshopId);
            subcontractorJobsTotal += job.price;

            reportHTML += `
                <tr>
                    <td>${new Date(job.date).toLocaleDateString('ar')}</td>
                    <td>${job.description}</td>
                    <td>${job.price.toLocaleString()} ₪</td>
                    <td>${jobWorkshop ? jobWorkshop.name : '-'}</td>
                </tr>
            `;
        });

        if (subcontractorJobs.length === 0) {
            reportHTML += `
                <tr>
                    <td colspan="4" style="text-align: center; color: #6c757d;">لا توجد طقات في هذه الفترة</td>
                </tr>
            `;
        }

        reportHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="2"><strong>إجمالي الطقات</strong></td>
                            <td><strong>${subcontractorJobsTotal.toLocaleString()} ₪</strong></td>
                            <td><strong>-</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <!-- جدول التكاليف الإضافية -->
                <h4>التكاليف الإضافية</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>وصف التكلفة</th>
                            <th>المبلغ</th>
                            <th>الورشة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        subcontractorCosts.forEach(cost => {
            const costWorkshop = workshops.find(w => w.id === cost.workshopId);
            subcontractorCostsTotal += cost.amount;

            reportHTML += `
                <tr>
                    <td>${new Date(cost.date).toLocaleDateString('ar')}</td>
                    <td>${cost.description}</td>
                    <td class="cost-amount">${cost.amount.toLocaleString()} ₪</td>
                    <td>${costWorkshop ? costWorkshop.name : 'غير محدد'}</td>
                    <td>${cost.notes || '-'}</td>
                </tr>
            `;
        });

        if (subcontractorCosts.length === 0) {
            reportHTML += `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6c757d;">لا توجد تكاليف إضافية في هذه الفترة</td>
                </tr>
            `;
        }

        reportHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row cost-total">
                            <td colspan="2"><strong>إجمالي التكاليف الإضافية</strong></td>
                            <td><strong>${subcontractorCostsTotal.toLocaleString()} ₪</strong></td>
                            <td colspan="2"><strong>-</strong></td>
                        </tr>
                    </tfoot>
                </table>

                <!-- ملخص الحساب -->
                <div class="account-summary">
                    <table class="report-table">
                        <tbody>
                            <tr class="positive-amount">
                                <td><strong>إجمالي طقات المقاولة</strong></td>
                                <td><strong>${subcontractorJobsTotal.toLocaleString()} ₪</strong></td>
                            </tr>
                            <tr class="negative-amount">
                                <td><strong>إجمالي التكاليف الإضافية</strong></td>
                                <td><strong>- ${subcontractorCostsTotal.toLocaleString()} ₪</strong></td>
                            </tr>
                            <tr class="net-total">
                                <td><strong>صافي الحساب</strong></td>
                                <td><strong>${(subcontractorJobsTotal - subcontractorCostsTotal).toLocaleString()} ₪</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        grandTotal += (subcontractorJobsTotal - subcontractorCostsTotal);
        grandJobsTotal += subcontractorJobsTotal;
        grandCostsTotal += subcontractorCostsTotal;
    });

    reportHTML += `
        <div class="report-summary">
            <h3>ملخص التقرير</h3>
            <div class="summary-table">
                <table class="report-table">
                    <tbody>
                        <tr class="positive-amount">
                            <td><strong>إجمالي طقات المقاولة</strong></td>
                            <td><strong>${grandJobsTotal.toLocaleString()} ₪</strong></td>
                        </tr>
                        <tr class="negative-amount">
                            <td><strong>صافي التكاليف الإضافية</strong></td>
                            <td><strong>- ${grandCostsTotal.toLocaleString()} ₪</strong></td>
                        </tr>
                        <tr class="net-total">
                            <td><strong>صافي حسابات مقاولين الباطن</strong></td>
                            <td><strong>${grandTotal.toLocaleString()} ₪</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="summary-info">
                <p><strong>عدد مقاولين الباطن:</strong> ${reportSubcontractors.length}</p>
                <p><strong>الفترة:</strong> من ${new Date(fromDate).toLocaleDateString('ar')} إلى ${new Date(toDate).toLocaleDateString('ar')}</p>
                <p><strong>تاريخ إنشاء التقرير:</strong> ${new Date().toLocaleDateString('ar')}</p>
            </div>
        </div>
    `;

    document.getElementById('subcontractorsReportContent').innerHTML = reportHTML;
    document.getElementById('printSubcontractorsReportBtn').style.display = 'inline-block';
    document.getElementById('printSubcontractorsReportColoredBtn').style.display = 'inline-block';
}

// طباعة تقرير مقاولين الباطن
function printSubcontractorsReport() {
    const reportContent = document.getElementById('subcontractorsReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير مقاولين الباطن</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// طباعة تقرير مقاولين الباطن ملونة
function printSubcontractorsReportColored() {
    const reportContent = document.getElementById('subcontractorsReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>تقرير مقاولين الباطن - طباعة ملونة</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; }
                    .report-header { text-align: center; margin-bottom: 2rem; }
                    .worker-report-section { margin-bottom: 2rem; page-break-inside: avoid; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; height: 28px; }
                    .report-table th { background-color: #f5f5f5; }
                    .total-row { background-color: #e8f5e8; font-weight: bold; }
                    .report-summary { background-color: #f8f9fa; padding: 1rem; border-radius: 8px; }

                    /* تلوين التكاليف الإضافية */
                    .negative-amount { background-color: #ffebee !important; color: #c62828 !important; }
                    .positive-amount { background-color: #e8f5e8 !important; color: #2e7d32 !important; }
                    .net-total { background-color: #e3f2fd !important; color: #1565c0 !important; }

                    /* تكبير اسم مقاول الباطن مع ظل */
                    .worker-report-section h3 {
                        font-size: 1.5rem !important;
                        font-weight: bold !important;
                        color: #2c3e50 !important;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3) !important;
                        margin-bottom: 0.5rem !important;
                    }

                    /* تصغير معلومات إضافية */
                    .worker-report-section p {
                        font-size: 0.85rem !important;
                        color: #6c757d !important;
                        margin: 0.25rem 0 !important;
                    }

                    @media print {
                        body { margin: 0; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    }
                </style>
                <script>
                    window.onload = function() {
                        // تلوين الأرقام السالبة
                        const cells = document.querySelectorAll('.report-table td');
                        cells.forEach(cell => {
                            if (cell.textContent.includes('-') && cell.textContent.includes('₪')) {
                                cell.style.backgroundColor = '#ffebee';
                                cell.style.color = '#c62828';
                            }
                        });

                        // تلوين التكاليف الإضافية
                        const costCells = document.querySelectorAll('.report-table td:nth-child(4)'); // التكاليف الإضافية
                        costCells.forEach(cell => {
                            if (parseFloat(cell.textContent.replace(/[^\d.-]/g, '')) > 0) {
                                cell.style.backgroundColor = '#fff3e0';
                                cell.style.color = '#f57c00';
                            }
                        });
                    };
                </script>
            </head>
            <body>${reportContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// تحديث سعر الساعة الإضافية بناءً على اليومية
function updateOvertimeRate(workerId) {
    const dailyWageInput = document.getElementById(`dailyWage-${workerId}`);
    const overtimeRateInput = document.getElementById(`overtimeRate-${workerId}`);

    if (dailyWageInput && overtimeRateInput) {
        const dailyWage = parseFloat(dailyWageInput.value) || 0;
        const hourlyRate = dailyWage / 8; // اليومية ÷ 8 ساعات
        overtimeRateInput.value = hourlyRate.toFixed(2);
        console.log(`💰 تم تحديث سعر الساعة للعامل ${workerId}: ${hourlyRate.toFixed(2)} (من يومية ${dailyWage})`);
    }
}

// تحديث حقل العامل وإعادة حساب صافي اليومية
function updateWorkerField(workerId) {
    // التحقق من حالة العامل
    const statusSelect = document.getElementById(`status-${workerId}`);
    const isAbsent = statusSelect && statusSelect.value === 'absent';

    const dailyWage = parseFloat(document.getElementById(`dailyWage-${workerId}`)?.value) || 0;
    const workDay = parseFloat(document.getElementById(`workDay-${workerId}`)?.value) || 0;
    const overtimeHours = parseFloat(document.getElementById(`overtimeHours-${workerId}`)?.value) || 0;
    const overtimeRate = parseFloat(document.getElementById(`overtimeRate-${workerId}`)?.value) || 0;
    const advance = parseFloat(document.getElementById(`advance-${workerId}`)?.value) || 0;
    const smokingCosts = parseFloat(document.getElementById(`smokingCosts-${workerId}`)?.value) || 0;

    let netDaily;

    if (isAbsent) {
        // العامل غائب: صافي اليومية = 0 إلا إذا كان فيه سلف/دخان
        if (advance > 0 || smokingCosts > 0) {
            netDaily = -(advance + smokingCosts);
        } else {
            netDaily = 0;
        }
    } else {
        // العامل حاضر: حساب عادي
        netDaily = calculateNetDaily(dailyWage, workDay, overtimeHours, overtimeRate, advance, smokingCosts);
    }

    // تحديث عرض صافي اليومية
    const netDailyElement = document.getElementById(`netDaily-${workerId}`);
    if (netDailyElement) {
        netDailyElement.textContent = `${netDaily.toFixed(0)} ₪`;

        // تلوين حسب القيمة
        if (netDaily < 0) {
            netDailyElement.style.color = '#dc3545'; // أحمر
        } else if (netDaily > 0) {
            netDailyElement.style.color = '#28a745'; // أخضر
        } else {
            netDailyElement.style.color = '#6c757d'; // رمادي
        }
    }

    // إزالة حالة الحفظ عند التعديل (البطاقة تحتاج حفظ جديد)
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (card && card.classList.contains('saved')) {
        // لا نزيل الـ saved class إذا كان التعديل بسيط
        // نتركه محفوظ ونحدث البيانات فقط
    }

    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();
}

// تحديث حالة العامل (حاضر/غائب)
function updateWorkerStatus(workerId, status) {
    const isPresent = status === 'present';

    // تحديث مؤشر الحالة فورياً
    const statusIndicator = document.getElementById(`statusIndicator-${workerId}`);
    if (statusIndicator) {
        statusIndicator.classList.remove('present', 'absent');
        statusIndicator.classList.add(isPresent ? 'present' : 'absent');
        statusIndicator.innerHTML = isPresent ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';

        // إضافة تأثير بصري للتغيير
        statusIndicator.style.transform = 'scale(1.3)';
        setTimeout(() => {
            statusIndicator.style.transform = 'scale(1)';
        }, 200);
    }

    // تحديث لون البطاقة
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (card) {
        card.classList.remove('present', 'absent', 'saved');
        card.classList.add(isPresent ? 'present' : 'absent');

        // التحكم في الحقول حسب الحالة
        const inputs = card.querySelectorAll('input');
        inputs.forEach(input => {
            if (!isPresent) {
                // السماح للسلف والدخان فقط للعامل الغائب
                const inputId = input.id;
                if (inputId.includes('advance') || inputId.includes('smokingCosts')) {
                    input.disabled = false;
                    input.readOnly = false;
                    input.style.background = '#fff3cd';
                    input.style.border = '2px solid #ffc107';
                } else {
                    input.disabled = true;
                    input.readOnly = true;
                    input.style.background = '#f8f9fa';
                }
            } else {
                // فتح جميع الحقول للعامل الحاضر
                input.disabled = false;
                input.readOnly = false;
                input.style.background = '#fff3cd';
                input.style.border = '2px solid #ffc107';
            }
        });

        // تفعيل زر الحفظ بعد تغيير الحالة
        const saveButton = card.querySelector('.btn.success');
        if (saveButton) {
            // التحقق من أن البطاقة في وضع التعديل
            const isInEditMode = card.classList.contains('editing') || card.getAttribute('data-editing') === 'true';
            
            saveButton.disabled = false;
            saveButton.removeAttribute('disabled');
            saveButton.style.opacity = '1';
            saveButton.style.cursor = 'pointer';
            saveButton.style.pointerEvents = 'auto';
            
            if (isInEditMode) {
                // في وضع التعديل - احتفظ بشكل زر الحفظ للتعديل
                saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ';
                saveButton.style.background = '';
                console.log('🔄 البطاقة في وضع التعديل، تم تفعيل زر الحفظ');
            } else {
                // في الوضع العادي
                saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ';
            }
            
            saveButton.onclick = function() { saveWorkerData(workerId); };
            console.log('✅ تم تفعيل زر الحفظ بعد تغيير الحالة:', status, 'وضع التعديل:', isInEditMode);
        }
    }

    // إعادة حساب صافي اليومية
    updateWorkerField(workerId);

    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();
}

// حساب صافي اليومية
function calculateNetDaily(dailyWage, workDay, overtimeHours, overtimeRate, advance, smokingCosts) {
    const basicPay = dailyWage * workDay;
    const overtimePay = overtimeHours * overtimeRate;
    const totalPay = basicPay + overtimePay;
    const netDaily = totalPay - advance - smokingCosts;
    return netDaily; // السماح بالقيم السالبة
}

// حفظ بيانات العامل
function saveWorkerData(workerId) {
    console.log('💾 بدء حفظ بيانات العامل:', workerId);

    // التحقق من حالة العامل
    const statusSelect = document.getElementById(`status-${workerId}`);
    const isAbsent = statusSelect && statusSelect.value === 'absent';

    if (isAbsent) {
        // العامل غائب - حفظ السلف والدخان فقط
        saveAbsentWorkerData(workerId);
        return;
    }

    const selectedDate = document.getElementById('attendanceDate').value;
    const status = document.querySelector(`[data-worker-id="${workerId}"] .status-select`).value;
    const workshopId = document.getElementById(`workshop-${workerId}`).value;
    const workshopIdNumber = workshopId ? parseInt(workshopId) : null;

    console.log('🏗️ حفظ الورشة للعامل:', workerId, 'الورشة:', workshopIdNumber);
    const dailyWage = parseFloat(document.getElementById(`dailyWage-${workerId}`).value) || 0;
    const workDay = parseFloat(document.getElementById(`workDay-${workerId}`).value) || 0;
    const overtimeHours = parseFloat(document.getElementById(`overtimeHours-${workerId}`).value) || 0;
    const overtimeRate = parseFloat(document.getElementById(`overtimeRate-${workerId}`).value) || 0;
    const advance = parseFloat(document.getElementById(`advance-${workerId}`).value) || 0;
    const smokingCosts = parseFloat(document.getElementById(`smokingCosts-${workerId}`).value) || 0;

    // حساب صافي اليومية
    const netDaily = calculateNetDaily(dailyWage, workDay, overtimeHours, overtimeRate, advance, smokingCosts);

    // إنشاء سجل الحضور
    const attendanceRecord = {
        id: Date.now() + Math.random(),
        workerId: workerId,
        contractorId: currentContractor.id,
        date: selectedDate,
        status: status,
        workshopId: workshopIdNumber,
        dailyWage: dailyWage,
        workDay: workDay,
        overtimeHours: overtimeHours,
        overtimeRate: overtimeRate,
        advance: advance,
        smokingCosts: smokingCosts,
        netDaily: netDaily,
        saved: true,
        timestamp: new Date().toISOString()
    };

    // حفظ في localStorage
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

    // حذف السجل القديم إن وجد
    attendance = attendance.filter(a =>
        !(a.workerId === workerId && a.date === selectedDate && a.contractorId === currentContractor.id)
    );

    // إضافة السجل الجديد
    attendance.push(attendanceRecord);
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // إضافة الخلفية الخضراء الشفافة للبطاقة
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (card) {
        card.classList.add('saved');
        card.classList.remove('editing');
        card.removeAttribute('data-editing');

        // تغيير زر الحفظ لمحفوظ مع إضافة علامات صح
        const saveButton = card.querySelector('.btn.success');
        if (saveButton) {
            // التحقق من عدد مرات الحفظ
            let saveCount = parseInt(saveButton.getAttribute('data-save-count') || '0') + 1;
            saveButton.setAttribute('data-save-count', saveCount);
            console.log('📊 عدد مرات الحفظ:', saveCount);

            // إضافة علامات صح حسب عدد مرات الحفظ
            let checkMarks = '';
            for (let i = 0; i < saveCount; i++) {
                checkMarks += '<i class="fas fa-check"></i>';
            }

            saveButton.innerHTML = `${checkMarks} محفوظ`;
            saveButton.style.background = '#28a745';
            saveButton.disabled = true;
            console.log('✅ تم تحديث زر الحفظ:', checkMarks + ' محفوظ');
        }

        // قفل جميع الحقول بعد الحفظ
        const inputs = card.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = true;
            input.readOnly = true;
            input.style.setProperty('background', '#f8f9fa', 'important');
            input.style.setProperty('border', '1px solid #e9ecef', 'important');
        });

        // قفل قائمة الحالة أيضاً بعد الحفظ
        const statusSelect = card.querySelector('select');
        if (statusSelect) {
            statusSelect.disabled = true;
            statusSelect.style.setProperty('background', '#f8f9fa', 'important');
            statusSelect.style.setProperty('border', '1px solid #e9ecef', 'important');
            console.log('🔒 تم قفل قائمة الحالة بعد الحفظ');
        }

        // إعادة زر التعديل لحالته الطبيعية وتفعيله
        const editBtn = card.querySelector('.btn.tiny:not(.success)');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'تعديل';
            editBtn.style.backgroundColor = '';
            editBtn.style.borderColor = '';
            editBtn.style.color = '';
            editBtn.disabled = false;
            editBtn.removeAttribute('disabled');
            editBtn.style.opacity = '1';
            editBtn.style.cursor = 'pointer';
            editBtn.style.pointerEvents = 'auto';
            
            // إزالة جميع event listeners السابقة وإضافة جديد
            editBtn.replaceWith(editBtn.cloneNode(true));
            const newEditBtn = card.querySelector('.btn.tiny:not(.success)');
            
            // إضافة onclick في HTML أيضاً كـ backup
            newEditBtn.setAttribute('onclick', `editWorkerAttendance(${workerId})`);
            
            // إضافة event listener
            newEditBtn.addEventListener('click', function(e) {
                e.preventDefault();
                editWorkerAttendance(workerId);
            });
            
            console.log('✅ تم تفعيل زر التعديل بعد الحفظ للعامل:', workerId);
        }

        console.log('🔒 تم قفل جميع الحقول بعد الحفظ');
    }

    console.log('تم حفظ بيانات العامل:', workerId, 'في التاريخ:', selectedDate);
    console.log('📊 بيانات الحضور المحفوظة:', attendanceRecord);
    
    // إعادة تحميل البيانات لتحديث العرض
    loadAttendanceForDate();
}

// تعديل بيانات العامل في اليوميات
function editWorkerAttendance(workerId) {
    console.log('🔧 بدء تعديل العامل:', workerId);
    
    // البحث عن البطاقة
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (!card) {
        alert('لم يتم العثور على بطاقة العامل!');
        console.error('❌ لم يتم العثور على بطاقة العامل:', workerId);
        return;
    }

    console.log('✅ تم العثور على البطاقة للعامل:', workerId);

    // البحث عن الحقول بطريقة مباشرة
    const dailyWage = document.getElementById(`dailyWage-${workerId}`);
    const workDay = document.getElementById(`workDay-${workerId}`);
    const overtimeHours = document.getElementById(`overtimeHours-${workerId}`);
    const overtimeRate = document.getElementById(`overtimeRate-${workerId}`);
    const advance = document.getElementById(`advance-${workerId}`);
    const smokingCosts = document.getElementById(`smokingCosts-${workerId}`);
    const status = document.getElementById(`status-${workerId}`);

    // فتح كل حقل بشكل مباشر
    if (dailyWage) {
        dailyWage.disabled = false;
        dailyWage.readOnly = false;
        dailyWage.style.backgroundColor = '#fff3cd';
        dailyWage.style.border = '2px solid #ffc107';
    }

    if (workDay) {
        workDay.disabled = false;
        workDay.readOnly = false;
        workDay.style.backgroundColor = '#fff3cd';
        workDay.style.border = '2px solid #ffc107';
    }

    if (overtimeHours) {
        overtimeHours.disabled = false;
        overtimeHours.readOnly = false;
        overtimeHours.style.backgroundColor = '#fff3cd';
        overtimeHours.style.border = '2px solid #ffc107';
    }

    if (overtimeRate) {
        overtimeRate.disabled = false;
        overtimeRate.readOnly = false;
        overtimeRate.style.backgroundColor = '#fff3cd';
        overtimeRate.style.border = '2px solid #ffc107';
    }

    if (advance) {
        advance.disabled = false;
        advance.readOnly = false;
        advance.style.backgroundColor = '#fff3cd';
        advance.style.border = '2px solid #ffc107';
    }

    if (smokingCosts) {
        smokingCosts.disabled = false;
        smokingCosts.readOnly = false;
        smokingCosts.style.backgroundColor = '#fff3cd';
        smokingCosts.style.border = '2px solid #ffc107';
    }

    if (status) {
        status.disabled = false;
        status.style.backgroundColor = '#fff3cd';
        status.style.border = '2px solid #ffc107';
        
        // إضافة مستمع للتغيير في حالة العامل
        status.addEventListener('change', function() {
            console.log('🔄 تم تغيير حالة العامل إلى:', this.value);
            
            // إزالة حالة الحفظ عند تغيير الحالة
            card.classList.remove('saved');
            
            // تحديث حالة العامل أولاً
            updateWorkerStatus(workerId, this.value);
            
            // ثم تفعيل زر الحفظ بعد التحديث
            setTimeout(() => {
                const saveBtn = card.querySelector('.btn.success');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.removeAttribute('disabled');
                    saveBtn.style.opacity = '1';
                    saveBtn.style.cursor = 'pointer';
                    saveBtn.style.pointerEvents = 'auto';
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
                    saveBtn.style.background = '';
                    
                    // إعادة تعيين onclick
                    saveBtn.onclick = function() { saveWorkerData(workerId); };
                    
                    // إضافة event listener جديد
                    saveBtn.removeEventListener('click', saveBtn.clickHandler);
                    saveBtn.clickHandler = function() { saveWorkerData(workerId); };
                    saveBtn.addEventListener('click', saveBtn.clickHandler);
                    
                    console.log('✅ تم تفعيل زر الحفظ بعد تغيير الحالة:', this.value);
                }
                
                // التأكد من فتح الحقول المناسبة للحالة الجديدة
                if (this.value === 'present') {
                    // فتح جميع الحقول للعامل الحاضر
                    const allInputs = card.querySelectorAll('input');
                    allInputs.forEach(input => {
                        input.disabled = false;
                        input.readOnly = false;
                        input.style.backgroundColor = '#fff3cd';
                        input.style.border = '2px solid #ffc107';
                    });
                } else {
                    // للعامل الغائب، فتح السلف والدخان فقط
                    const advanceInput = document.getElementById(`advance-${workerId}`);
                    const smokingInput = document.getElementById(`smokingCosts-${workerId}`);
                    
                    if (advanceInput) {
                        advanceInput.disabled = false;
                        advanceInput.readOnly = false;
                        advanceInput.style.backgroundColor = '#fff3cd';
                        advanceInput.style.border = '2px solid #ffc107';
                    }
                    
                    if (smokingInput) {
                        smokingInput.disabled = false;
                        smokingInput.readOnly = false;
                        smokingInput.style.backgroundColor = '#fff3cd';
                        smokingInput.style.border = '2px solid #ffc107';
                    }
                }
            }, 100);
        });
    }

    // إزالة حالة الحفظ وإضافة علامة التعديل
    card.classList.remove('saved');
    card.classList.add('editing');
    card.setAttribute('data-editing', 'true');

    // تفعيل زر الحفظ بقوة
    const saveButton = card.querySelector('.btn.success');
    if (saveButton) {
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.disabled = false;
        saveButton.removeAttribute('disabled');
        saveButton.removeAttribute('data-save-count'); // إعادة تعيين العداد
        saveButton.style.background = '';
        saveButton.style.cursor = 'pointer';
        saveButton.style.opacity = '1';
        saveButton.onclick = function() {
            saveWorkerData(workerId);
        };
        // إضافة event listener كـ backup
        saveButton.addEventListener('click', function() {
            saveWorkerData(workerId);
        });

        // تشخيص حالة الزر
        console.log('🔍 حالة زر الحفظ:', {
            disabled: saveButton.disabled,
            hasDisabledAttr: saveButton.hasAttribute('disabled'),
            cursor: saveButton.style.cursor,
            opacity: saveButton.style.opacity,
            onclick: saveButton.onclick ? 'موجود' : 'مفقود'
        });
    }

    // تغيير زر التعديل لزر أصفر
    const editBtn = card.querySelector('.btn.tiny:not(.success)');
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'جاري التعديل';
        editBtn.style.backgroundColor = '#ffc107';
        editBtn.style.borderColor = '#ffc107';
        editBtn.style.color = '#000';
        editBtn.onclick = null; // إزالة الوظيفة - الزر غير نشط أثناء التعديل
        editBtn.disabled = true; // تعطيل الزر أثناء التعديل
    }

    // تأثير بصري للبطاقة
    card.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.8)';
}

// إلغاء تعديل بيانات العامل
function cancelEditWorkerAttendance(workerId) {
    // إعادة تحميل البيانات للتراجع عن التعديلات
    loadAttendanceForDate();
}

// حفظ جميع العمال
function saveAllAttendance() {
    const workerCards = document.querySelectorAll('.worker-grid-card');
    let savedCount = 0;

    workerCards.forEach(card => {
        const workerId = parseInt(card.getAttribute('data-worker-id'));
        if (workerId) {
            saveWorkerData(workerId);
            savedCount++;
        }
    });

    // إظهار رسالة نجاح
    if (savedCount > 0) {
        showNotification(`تم حفظ بيانات ${savedCount} عامل بنجاح`, 'success');
    }
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // إضافة CSS للإشعار
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // إزالة الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// أحجام البطاقات المتاحة
const cardSizes = [200, 250, 300, 350, 400, 450, 500];
let currentSizeIndex = 2; // البداية من 300px

// تكبير البطاقات
function increaseCardSize() {
    if (currentSizeIndex < cardSizes.length - 1) {
        currentSizeIndex++;
        applyCardSize();
    }
}

// تصغير البطاقات
function decreaseCardSize() {
    if (currentSizeIndex > 0) {
        currentSizeIndex--;
        applyCardSize();
    }
}

// تطبيق حجم البطاقات
function applyCardSize() {
    const cardsGrid = document.getElementById('workersCards');
    if (cardsGrid) {
        const size = cardSizes[currentSizeIndex];
        cardsGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;

        // حفظ التفضيل
        localStorage.setItem('workerCardSizeIndex', currentSizeIndex);
    }
}

// تحميل حجم البطاقات المحفوظ
function loadSavedCardSize() {
    const savedIndex = localStorage.getItem('workerCardSizeIndex');
    if (savedIndex !== null) {
        currentSizeIndex = parseInt(savedIndex);
    }
    applyCardSize();
}

// متغيرات لحجم بطاقات اليوميات
let attendanceCardSizeIndex = 1; // البداية من 201px
const attendanceCardSizes = [160, 180, 220, 260, 300];

// تكبير بطاقات اليوميات
function increaseAttendanceCardSize() {
    if (attendanceCardSizeIndex < attendanceCardSizes.length - 1) {
        attendanceCardSizeIndex++;
        applyAttendanceCardSize();
    }
}

// تصغير بطاقات اليوميات
function decreaseAttendanceCardSize() {
    if (attendanceCardSizeIndex > 0) {
        attendanceCardSizeIndex--;
        applyAttendanceCardSize();
    }
}

// تطبيق حجم بطاقات اليوميات
function applyAttendanceCardSize() {
    const workersGrid = document.getElementById('workersGrid');
    if (workersGrid) {
        const size = attendanceCardSizes[attendanceCardSizeIndex];
        workersGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;

        // حفظ التفضيل
        localStorage.setItem('attendanceCardSizeIndex', attendanceCardSizeIndex);
    }
}

// تحميل حجم بطاقات اليوميات المحفوظ
function loadSavedAttendanceCardSize() {
    const savedIndex = localStorage.getItem('attendanceCardSizeIndex');
    if (savedIndex !== null) {
        attendanceCardSizeIndex = parseInt(savedIndex);
    }
    applyAttendanceCardSize();
}

// إظهار رسالة منع حفظ العامل الغائب
function showAbsentWorkerMessage() {
    // إزالة أي رسالة موجودة
    const existingMessage = document.getElementById('absentWorkerMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    // إنشاء الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.id = 'absentWorkerMessage';
    messageDiv.innerHTML = `
        <div class="absent-message-content">
            <div class="absent-message-icon">
                <i class="fas fa-user-times"></i>
            </div>
            <h3>العامل غائب</h3>
            <p>لا يمكن حفظ عامل غائب</p>
            <button class="btn danger" onclick="closeAbsentMessage()">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;

    // إضافة الرسالة للصفحة
    document.body.appendChild(messageDiv);

    // إغلاق تلقائي بعد 5 ثواني
    setTimeout(() => {
        closeAbsentMessage();
    }, 5000);
}

// إغلاق رسالة العامل الغائب
function closeAbsentMessage() {
    const message = document.getElementById('absentWorkerMessage');
    if (message) {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            message.remove();
        }, 300);
    }
}

// دوال محذوفة - غير مطلوبة

// حفظ بيانات العامل الغائب (السلف والدخان فقط)
function saveAbsentWorkerData(workerId) {
    const selectedDate = document.getElementById('attendanceDate').value;

    // جمع بيانات السلف والدخان والورشة
    const workshopId = document.getElementById(`workshop-${workerId}`).value;
    const workshopIdNumber = workshopId ? parseInt(workshopId) : null;
    const advance = parseFloat(document.getElementById(`advance-${workerId}`).value) || 0;
    const smokingCosts = parseFloat(document.getElementById(`smokingCosts-${workerId}`).value) || 0;

    console.log('🏗️ حفظ الورشة للعامل الغائب:', workerId, 'الورشة:', workshopIdNumber);

    // إنشاء سجل للعامل الغائب (حتى لو لم تكن هناك تكاليف)
    const attendanceRecord = {
        workerId: workerId,
        contractorId: currentContractor.id,
        date: selectedDate,
        status: 'absent',
        workshopId: workshopIdNumber,
        dailyWage: 0,
        workDay: 0,
        overtimeHours: 0,
        overtimeRate: 0,
        advance: advance,
        smokingCosts: smokingCosts,
        netDaily: -(advance + smokingCosts), // صافي سالب
        saved: true
    };

    // حفظ البيانات
    let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    const existingIndex = attendanceData.findIndex(record =>
        record.workerId === workerId && record.date === selectedDate
    );

    if (existingIndex !== -1) {
        attendanceData[existingIndex] = attendanceRecord;
    } else {
        attendanceData.push(attendanceRecord);
    }

    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));

    // حفظ في attendance أيضاً
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const existingAttendanceIndex = attendance.findIndex(record =>
        record.workerId === workerId && record.date === selectedDate
    );

    if (existingAttendanceIndex !== -1) {
        attendance[existingAttendanceIndex] = attendanceRecord;
    } else {
        attendance.push(attendanceRecord);
    }

    localStorage.setItem('attendance', JSON.stringify(attendance));
    console.log('💾 تم حفظ بيانات العامل الغائب في attendance و attendanceData:', attendanceRecord);

    // تحديث واجهة العامل الغائب
    const card = document.querySelector(`[data-worker-id="${workerId}"]`);
    if (card) {
        card.classList.add('saved');
        card.classList.remove('editing');
        card.removeAttribute('data-editing');

        // تحديث زر الحفظ
        const saveButton = card.querySelector('.btn.success');
        if (saveButton) {
            let saveCount = parseInt(saveButton.getAttribute('data-save-count') || '0') + 1;
            saveButton.setAttribute('data-save-count', saveCount);

            let checkMarks = '';
            for (let i = 0; i < saveCount; i++) {
                checkMarks += '<i class="fas fa-check"></i>';
            }

            saveButton.innerHTML = `${checkMarks} محفوظ`;
            saveButton.style.background = '#28a745';
            saveButton.disabled = true;
        }

        // قفل جميع الحقول
        const inputs = card.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = true;
            input.readOnly = true;
            input.style.background = '#f8f9fa';
        });

        // قفل قائمة الحالة
        const statusSelect = card.querySelector('select');
        if (statusSelect) {
            statusSelect.disabled = true;
            statusSelect.style.background = '#f8f9fa';
        }

        // إعادة زر التعديل لحالته الطبيعية وتفعيله
        const editBtn = card.querySelector('.btn.tiny:not(.success)');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'تعديل';
            editBtn.style.backgroundColor = '';
            editBtn.style.borderColor = '';
            editBtn.style.color = '';
            editBtn.disabled = false;
            editBtn.removeAttribute('disabled');
            editBtn.style.opacity = '1';
            editBtn.style.cursor = 'pointer';
            editBtn.style.pointerEvents = 'auto';
            
            // إزالة جميع event listeners السابقة وإضافة جديد
            editBtn.replaceWith(editBtn.cloneNode(true));
            const newEditBtn = card.querySelector('.btn.tiny:not(.success)');
            
            // إضافة onclick في HTML أيضاً كـ backup
            newEditBtn.setAttribute('onclick', `editWorkerAttendance(${workerId})`);
            
            // إضافة event listener
            newEditBtn.addEventListener('click', function(e) {
                e.preventDefault();
                editWorkerAttendance(workerId);
            });
            
            console.log('✅ تم تفعيل زر التعديل بعد الحفظ للعامل الغائب:', workerId);
        }

        // إعادة تحديث صافي اليومية
        updateWorkerField(workerId);
    }

    // إظهار رسالة نجاح حفظ العامل الغائب
    showAbsentSavedMessage();

    console.log('تم حفظ العامل الغائب:', workerId, 'صافي:', -(advance + smokingCosts));
}

// إظهار رسالة نجاح حفظ العامل الغائب
function showAbsentSavedMessage() {
    // إزالة أي رسالة موجودة
    const existingMessage = document.getElementById('absentSavedMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    // إنشاء الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.id = 'absentSavedMessage';
    messageDiv.innerHTML = `
        <div class="absent-saved-content">
            <div class="absent-saved-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>تم حفظ بيانات غائب</h3>
            <p>بسبب تكاليف إضافية</p>
            <button class="btn success" onclick="closeAbsentSavedMessage()">
                <i class="fas fa-check"></i> موافق
            </button>
        </div>
    `;

    // إضافة الرسالة للصفحة
    document.body.appendChild(messageDiv);

    // إغلاق تلقائي بعد 3 ثواني
    setTimeout(() => {
        closeAbsentSavedMessage();
    }, 3000);
}

// إغلاق رسالة حفظ العامل الغائب
function closeAbsentSavedMessage() {
    const message = document.getElementById('absentSavedMessage');
    if (message) {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            message.remove();
        }, 300);
    }
}

// رسائل مخصصة لمقاولين الباطن
function showSubcontractorConfirmDialog(title, message, details, actionText, actionColor, onConfirm) {
    // إزالة أي رسالة موجودة
    const existingDialog = document.getElementById('subcontractorConfirmDialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // إنشاء الرسالة
    const dialogDiv = document.createElement('div');
    dialogDiv.id = 'subcontractorConfirmDialog';
    dialogDiv.innerHTML = `
        <div class="subcontractor-dialog-content">
            <div class="subcontractor-dialog-icon ${actionColor}">
                <i class="fas fa-${actionColor === 'danger' ? 'exclamation-triangle' : 'question-circle'}"></i>
            </div>
            <h3>${title}</h3>
            <p class="main-message">${message}</p>
            ${details ? `<p class="details">${details}</p>` : ''}
            <div class="dialog-buttons">
                <button class="btn ${actionColor}" onclick="confirmSubcontractorAction()">
                    <i class="fas fa-check"></i> ${actionText}
                </button>
                <button class="btn secondary" onclick="closeSubcontractorDialog()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
            </div>
        </div>
    `;

    // حفظ دالة التأكيد
    window.subcontractorConfirmAction = onConfirm;

    // إضافة الرسالة للصفحة
    document.body.appendChild(dialogDiv);
}

function confirmSubcontractorAction() {
    if (window.subcontractorConfirmAction) {
        window.subcontractorConfirmAction();
        window.subcontractorConfirmAction = null;
    }
    closeSubcontractorDialog();
}

function closeSubcontractorDialog() {
    const dialog = document.getElementById('subcontractorConfirmDialog');
    if (dialog) {
        dialog.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            dialog.remove();
        }, 300);
    }
}

function showSubcontractorSuccessMessage(message) {
    // إزالة أي رسالة موجودة
    const existingMessage = document.getElementById('subcontractorSuccessMessage');
    if (existingMessage) {
        existingMessage.remove();
    }

    // إنشاء الرسالة
    const messageDiv = document.createElement('div');
    messageDiv.id = 'subcontractorSuccessMessage';
    messageDiv.innerHTML = `
        <div class="subcontractor-success-content">
            <div class="subcontractor-success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>تم بنجاح</h3>
            <p>${message}</p>
            <button class="btn success" onclick="closeSubcontractorSuccessMessage()">
                <i class="fas fa-check"></i> موافق
            </button>
        </div>
    `;

    // إضافة الرسالة للصفحة
    document.body.appendChild(messageDiv);

    // إغلاق تلقائي بعد 3 ثواني
    setTimeout(() => {
        closeSubcontractorSuccessMessage();
    }, 3000);
}

// إنشاء قسم العمال في التقرير الشامل
function generateWorkersSection(workers, attendance, workshops) {
    let content = `
        <div class="report-section">
            <h3><i class="fas fa-users"></i> تقرير العمال</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>اسم العامل</th>
                        <th>رقم العامل</th>
                        <th>الورشة</th>
                        <th>إجمالي أيام العمل</th>
                        <th>إجمالي الساعات الإضافية</th>
                        <th>إجمالي اليوميات</th>
                        <th>إجمالي أجر الساعات الإضافية</th>
                        <th>إجمالي المدفوعات</th>
                        <th>إجمالي السلف</th>
                        <th>إجمالي تكاليف الدخان</th>
                        <th>صافي الراتب النهائي</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalWorkDays = 0;
    let totalOvertimeHours = 0;
    let totalDailyWages = 0;
    let totalOvertimePay = 0;
    let totalPayments = 0;
    let totalAdvances = 0;
    let totalSmokingCosts = 0;
    let totalNetSalary = 0;

    workers.forEach(worker => {
        const workerAttendance = attendance.filter(a => a.workerId === worker.id);

        // الحصول على الورشة من آخر سجل حضور أو من بيانات العامل
        const latestAttendance = workerAttendance.length > 0 ? workerAttendance[workerAttendance.length - 1] : null;
        const workshopId = latestAttendance?.workshopId || worker.workshopId;
        const workshop = workshops.find(w => w.id === workshopId);

        // حساب الإجماليات الشاملة للعامل في الفترة المحددة
        const workDays = workerAttendance.filter(a => a.status === 'حاضر').length;
        const overtimeHours = workerAttendance.reduce((sum, a) => sum + (parseFloat(a.overtimeHours) || 0), 0);

        // حساب إجمالي اليوميات (بدون الساعات الإضافية)
        const dailyWages = workerAttendance.reduce((sum, a) => {
            if (a.status === 'حاضر') {
                return sum + (parseFloat(a.dailyWage) || 0);
            }
            return sum;
        }, 0);

        // حساب إجمالي أجر الساعات الإضافية
        const overtimePay = workerAttendance.reduce((sum, a) => {
            if (a.status === 'حاضر') {
                return sum + ((parseFloat(a.overtimeHours) || 0) * (parseFloat(a.overtimeRate) || 0));
            }
            return sum;
        }, 0);

        // إجمالي المدفوعات = اليوميات + أجر الساعات الإضافية
        const totalPaymentsForWorker = dailyWages + overtimePay;

        // إجمالي السلف وتكاليف الدخان
        const advances = workerAttendance.reduce((sum, a) => sum + (parseFloat(a.advance) || 0), 0);
        const smokingCosts = workerAttendance.reduce((sum, a) => sum + (parseFloat(a.smokingCost) || 0), 0);

        // صافي الراتب النهائي = إجمالي المدفوعات - إجمالي السلف - إجمالي تكاليف الدخان
        const netSalary = totalPaymentsForWorker - advances - smokingCosts;

        // إضافة للإجماليات العامة
        totalWorkDays += workDays;
        totalOvertimeHours += overtimeHours;
        totalDailyWages += dailyWages;
        totalOvertimePay += overtimePay;
        totalPayments += totalPaymentsForWorker;
        totalAdvances += advances;
        totalSmokingCosts += smokingCosts;
        totalNetSalary += netSalary;

        content += `
            <tr>
                <td><strong>${worker.name}</strong></td>
                <td>${worker.workerNumber || '#'}</td>
                <td>${workshop ? workshop.name : 'غير محدد'}</td>
                <td><strong>${workDays} يوم</strong></td>
                <td><strong>${overtimeHours.toFixed(1)} ساعة</strong></td>
                <td>${dailyWages.toFixed(2)} ₪</td>
                <td>${overtimePay.toFixed(2)} ₪</td>
                <td><strong>${totalPaymentsForWorker.toFixed(2)} ₪</strong></td>
                <td>${advances.toFixed(2)} ₪</td>
                <td>${smokingCosts.toFixed(2)} ₪</td>
                <td><strong>${netSalary.toFixed(2)} ₪</strong></td>
            </tr>
        `;
    });

    // صف الإجمالي العام
    content += `
                <tr class="total-row">
                    <td colspan="3"><strong>الإجمالي العام</strong></td>
                    <td><strong>${totalWorkDays} يوم</strong></td>
                    <td><strong>${totalOvertimeHours.toFixed(1)} ساعة</strong></td>
                    <td><strong>${totalDailyWages.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalOvertimePay.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalPayments.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalAdvances.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalSmokingCosts.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalNetSalary.toFixed(2)} ₪</strong></td>
                </tr>
            </tbody>
        </table>
        </div>
    `;

    return content;
}



// إنشاء قسم المعاليم في التقرير الشامل
function generateForemenSection(foremenExpenses, foremen) {
    if (foremenExpenses.length === 0) {
        return `
            <div class="report-section">
                <h3><i class="fas fa-user-tie"></i> تقرير المعاليم</h3>
                <p class="no-data">لا توجد مصاريف معاليم في الفترة المحددة</p>
            </div>
        `;
    }

    let content = `
        <div class="report-section">
            <h3><i class="fas fa-user-tie"></i> تقرير المعاليم</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>اسم المعلم</th>
                        <th>إجمالي المصاريف</th>
                        <th>عدد الأيام</th>
                        <th>متوسط المصاريف اليومية</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalExpenses = 0;
    let totalDays = 0;

    // تجميع المصاريف حسب المعلم
    const foremenSummary = {};
    foremenExpenses.forEach(expense => {
        const foreman = foremen.find(f => f.id === expense.foremanId);
        const foremanName = foreman ? foreman.name : 'غير محدد';

        if (!foremenSummary[expense.foremanId]) {
            foremenSummary[expense.foremanId] = {
                name: foremanName,
                totalAmount: 0,
                days: 0
            };
        }

        foremenSummary[expense.foremanId].totalAmount += parseFloat(expense.amount) || 0;
        foremenSummary[expense.foremanId].days += 1;
    });

    // إضافة صفوف المعاليم
    Object.values(foremenSummary).forEach(summary => {
        const avgDaily = summary.days > 0 ? summary.totalAmount / summary.days : 0;

        totalExpenses += summary.totalAmount;
        totalDays += summary.days;

        content += `
            <tr>
                <td>${summary.name}</td>
                <td>${summary.totalAmount.toFixed(2)} ₪</td>
                <td>${summary.days}</td>
                <td>${avgDaily.toFixed(2)} ₪</td>
            </tr>
        `;
    });

    // صف الإجمالي
    const avgTotal = totalDays > 0 ? totalExpenses / totalDays : 0;
    content += `
                <tr class="total-row">
                    <td><strong>الإجمالي</strong></td>
                    <td><strong>${totalExpenses.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalDays}</strong></td>
                    <td><strong>${avgTotal.toFixed(2)} ₪</strong></td>
                </tr>
            </tbody>
        </table>
        </div>
    `;

    return content;
}

// إنشاء قسم مقاولين الباطن في التقرير الشامل
function generateSubcontractorsSection(subcontractorTeams, additionalCosts) {
    if (subcontractorTeams.length === 0) {
        return `
            <div class="report-section">
                <h3><i class="fas fa-hard-hat"></i> تقرير مقاولين الباطن</h3>
                <p class="no-data">لا توجد فرق مقاولين باطن مسجلة</p>
            </div>
        `;
    }

    let content = `
        <div class="report-section">
            <h3><i class="fas fa-hard-hat"></i> تقرير مقاولين الباطن</h3>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>اسم مقاول الباطن</th>
                        <th>سعر الطقة</th>
                        <th>عدد الطقات</th>
                        <th>إجمالي التكاليف الإضافية</th>
                        <th>صافي المدفوعات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalTeamCosts = 0;
    let totalAdditionalCosts = 0;
    let totalNetPayments = 0;

    subcontractorTeams.forEach(team => {
        // حساب التكاليف الإضافية لهذا المقاول
        const teamAdditionalCosts = additionalCosts
            .filter(cost => cost.subcontractorName === team.subcontractorName)
            .reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);

        const teamCost = (parseFloat(team.ratePerUnit) || 0) * (parseInt(team.unitsCompleted) || 0);
        const netPayment = teamCost - teamAdditionalCosts;

        totalTeamCosts += teamCost;
        totalAdditionalCosts += teamAdditionalCosts;
        totalNetPayments += netPayment;

        content += `
            <tr>
                <td>${team.subcontractorName}</td>
                <td>${(parseFloat(team.ratePerUnit) || 0).toFixed(2)} ₪</td>
                <td>${team.unitsCompleted || 0}</td>
                <td>${teamAdditionalCosts.toFixed(2)} ₪</td>
                <td>${netPayment.toFixed(2)} ₪</td>
            </tr>
        `;
    });

    // صف الإجمالي
    content += `
                <tr class="total-row">
                    <td><strong>الإجمالي</strong></td>
                    <td colspan="2"><strong>${totalTeamCosts.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalAdditionalCosts.toFixed(2)} ₪</strong></td>
                    <td><strong>${totalNetPayments.toFixed(2)} ₪</strong></td>
                </tr>
            </tbody>
        </table>
        </div>
    `;

    return content;
}

// إنشاء الملخص العام الشامل
function generateComprehensiveSummary(workers, attendance, foremenExpenses, subcontractorTeams, additionalCosts, includeForemen, includeSubcontractors) {
    // حساب إجماليات العمال
    const totalWorkerPayments = attendance.reduce((sum, a) => {
        if (a.status === 'حاضر') {
            const dailyWage = parseFloat(a.dailyWage) || 0;
            const overtimePay = (parseFloat(a.overtimeHours) || 0) * (parseFloat(a.overtimeRate) || 0);
            return sum + dailyWage + overtimePay;
        }
        return sum;
    }, 0);

    const totalWorkerAdvances = attendance.reduce((sum, a) => sum + (parseFloat(a.advance) || 0), 0);
    const totalWorkerSmokingCosts = attendance.reduce((sum, a) => sum + (parseFloat(a.smokingCost) || 0), 0);
    const totalWorkerNetPayments = totalWorkerPayments - totalWorkerAdvances - totalWorkerSmokingCosts;

    // حساب إجماليات المعاليم
    const totalForemenExpenses = includeForemen ?
        foremenExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) : 0;

    // حساب إجماليات مقاولين الباطن
    const totalSubcontractorPayments = includeSubcontractors ?
        subcontractorTeams.reduce((sum, team) => {
            return sum + ((parseFloat(team.ratePerUnit) || 0) * (parseInt(team.unitsCompleted) || 0));
        }, 0) : 0;

    const totalSubcontractorAdditionalCosts = includeSubcontractors ?
        additionalCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0) : 0;

    const totalSubcontractorNetPayments = totalSubcontractorPayments - totalSubcontractorAdditionalCosts;

    // الإجمالي العام
    const grandTotalPayments = totalWorkerNetPayments + totalForemenExpenses + totalSubcontractorNetPayments;

    let content = `
        <div class="report-summary">
            <h3><i class="fas fa-chart-pie"></i> الملخص العام الشامل</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">إجمالي مدفوعات العمال</span>
                    <span class="summary-value">${totalWorkerNetPayments.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي سلف العمال</span>
                    <span class="summary-value">${totalWorkerAdvances.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي تكاليف الدخان</span>
                    <span class="summary-value">${totalWorkerSmokingCosts.toFixed(2)} ₪</span>
                </div>
    `;

    if (includeForemen) {
        content += `
                <div class="summary-item">
                    <span class="summary-label">إجمالي مصاريف المعاليم</span>
                    <span class="summary-value">${totalForemenExpenses.toFixed(2)} ₪</span>
                </div>
        `;
    }

    if (includeSubcontractors) {
        content += `
                <div class="summary-item">
                    <span class="summary-label">إجمالي مدفوعات مقاولين الباطن</span>
                    <span class="summary-value">${totalSubcontractorNetPayments.toFixed(2)} ₪</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">إجمالي تكاليف إضافية لمقاولين الباطن</span>
                    <span class="summary-value">${totalSubcontractorAdditionalCosts.toFixed(2)} ₪</span>
                </div>
        `;
    }

    content += `
                <div class="summary-item total-summary">
                    <span class="summary-label">الإجمالي العام</span>
                    <span class="summary-value">${grandTotalPayments.toFixed(2)} ₪</span>
                </div>
            </div>
        </div>
    `;

    return content;
}



function closeSubcontractorSuccessMessage() {
    const message = document.getElementById('subcontractorSuccessMessage');
    if (message) {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            message.remove();
        }, 300);
    }
}

// إدارة نافذة تعديل المصروف
function showEditExpenseModal() {
    document.getElementById('editExpenseModal').style.display = 'block';
    document.getElementById('editExpenseDescription').focus();
}

function hideEditExpenseModal() {
    document.getElementById('editExpenseModal').style.display = 'none';
    document.getElementById('editExpenseForm').reset();
}

// تحميل قائمة الورش في نافذة التعديل
function loadEditExpenseWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshopSelect = document.getElementById('editExpenseWorkshop');

    if (workshopSelect) {
        workshopSelect.innerHTML = '<option value="">اختر الورشة</option>';
        workshops.forEach(workshop => {
            const option = document.createElement('option');
            option.value = workshop.id;
            option.textContent = workshop.name;
            workshopSelect.appendChild(option);
        });
    }
}

// معالجة إرسال نموذج تعديل المصروف
function handleEditExpenseSubmit(e) {
    e.preventDefault();

    const expenseId = parseInt(document.getElementById('editExpenseId').value);
    const formData = {
        foremanId: parseInt(document.getElementById('editExpenseForemanId').value),
        description: document.getElementById('editExpenseDescription').value.trim(),
        amount: parseFloat(document.getElementById('editExpenseAmount').value),
        date: document.getElementById('editExpenseDate').value,
        workshopId: document.getElementById('editExpenseWorkshop').value || null,
        notes: document.getElementById('editExpenseNotes').value.trim()
    };

    if (!formData.description || !formData.amount || !formData.date) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    // تحديث المصروف
    let expenses = JSON.parse(localStorage.getItem('foremanExpenses')) || [];
    const expenseIndex = expenses.findIndex(e => e.id === expenseId);

    if (expenseIndex !== -1) {
        expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            ...formData,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('foremanExpenses', JSON.stringify(expenses));

        // إخفاء النافذة المنبثقة
        hideEditExpenseModal();

        // تحديث القائمة
        loadForemenList();

        showSuccessMessage('تم تحديث بيانات المصروف بنجاح!', 'edit');
    }
}

// إعداد نافذة تعديل المصروف
function setupEditExpenseModal() {
    const editExpenseForm = document.getElementById('editExpenseForm');
    if (editExpenseForm) {
        editExpenseForm.addEventListener('submit', handleEditExpenseSubmit);
    }

    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('editExpenseModal');
        if (e.target === modal) {
            hideEditExpenseModal();
        }
    });
}

// إظهار رسالة نجاح محسنة
function showSuccessMessage(message, icon = 'check') {
    // إزالة أي رسالة موجودة
    const existingMessage = document.querySelector('.success-message-overlay');
    if (existingMessage) {
        existingMessage.remove();
    }

    // إنشاء رسالة النجاح
    const messageOverlay = document.createElement('div');
    messageOverlay.className = 'success-message-overlay';
    messageOverlay.innerHTML = `
        <div class="success-message-content">
            <div class="success-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="success-text">${message}</div>
            <div class="success-close" onclick="closeSuccessMessage()">
                <i class="fas fa-times"></i>
            </div>
        </div>
    `;

    document.body.appendChild(messageOverlay);

    // إظهار الرسالة مع تأثير
    setTimeout(() => {
        messageOverlay.classList.add('show');
    }, 10);

    // إخفاء الرسالة تلقائياً بعد 3 ثوان
    setTimeout(() => {
        closeSuccessMessage();
    }, 3000);
}

// إغلاق رسالة النجاح
function closeSuccessMessage() {
    const messageOverlay = document.querySelector('.success-message-overlay');
    if (messageOverlay) {
        messageOverlay.classList.add('hide');
        setTimeout(() => {
            messageOverlay.remove();
        }, 300);
    }
}

// ===== دوال الأرشفة =====

// أرشفة عامل
function archiveWorker(workerId) {
    if (!confirm('هل أنت متأكد من أرشفة هذا العامل؟\nسيتم نقله إلى الأرشيف ولن يظهر في القوائم العادية.')) {
        return;
    }

    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerIndex = workers.findIndex(w => w.id === workerId);

    if (workerIndex !== -1) {
        workers[workerIndex].archived = true;
        workers[workerIndex].archivedAt = new Date().toISOString();
        localStorage.setItem('workers', JSON.stringify(workers));

        showSuccessMessage('تم أرشفة العامل بنجاح!', 'archive');
        loadWorkersTable();
    }
}

// إظهار العمال المؤرشفين
function showArchivedWorkers() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const archivedWorkers = workers.filter(w => w.contractorId === currentContractor.id && w.archived);

    if (archivedWorkers.length === 0) {
        alert('لا يوجد عمال مؤرشفين');
        return;
    }

    let modalHTML = `
        <div id="archivedWorkersModal" class="modal" style="display: block;">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-archive"></i> العمال المؤرشفين</h3>
                    <span class="close" onclick="closeArchivedWorkersModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>اسم العامل</th>
                                <th>رقم العامل</th>
                                <th>الورشة</th>
                                <th>اليومية</th>
                                <th>تاريخ الأرشفة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    archivedWorkers.forEach(worker => {
        const workshop = workshops.find(w => w.id === worker.workshopId);
        const archivedDate = worker.archivedAt ? new Date(worker.archivedAt).toLocaleDateString('ar') : '-';

        modalHTML += `
            <tr>
                <td>${worker.name}</td>
                <td>${worker.number || '-'}</td>
                <td>${workshop ? workshop.name : 'غير محدد'}</td>
                <td>${worker.dailyWage} ₪</td>
                <td>${archivedDate}</td>
                <td>
                    <button class="btn small success" onclick="unarchiveWorker(${worker.id})" title="إلغاء الأرشفة">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn small" onclick="editArchivedWorker(${worker.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn small danger" onclick="deleteArchivedWorker(${worker.id})" title="حذف نهائي">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    modalHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // إزالة أي modal موجود
    const existingModal = document.getElementById('archivedWorkersModal');
    if (existingModal) {
        existingModal.remove();
    }

    // إضافة الـ modal الجديد
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// إغلاق modal العمال المؤرشفين
function closeArchivedWorkersModal() {
    const modal = document.getElementById('archivedWorkersModal');
    if (modal) {
        modal.remove();
    }
}

// إلغاء أرشفة عامل
function unarchiveWorker(workerId) {
    if (!confirm('هل أنت متأكد من إلغاء أرشفة هذا العامل؟\nسيعود للظهور في القوائم العادية.')) {
        return;
    }

    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerIndex = workers.findIndex(w => w.id === workerId);

    if (workerIndex !== -1) {
        delete workers[workerIndex].archived;
        delete workers[workerIndex].archivedAt;
        localStorage.setItem('workers', JSON.stringify(workers));

        showSuccessMessage('تم إلغاء أرشفة العامل بنجاح!', 'undo');
        closeArchivedWorkersModal();
        loadWorkersTable();
        
        // تحديث إحصائيات اللوحة الرئيسية
        updateDashboardStats();
    }
}

// تعديل عامل مؤرشف
function editArchivedWorker(workerId) {
    // نفس دالة تعديل العامل العادي
    editWorker(workerId);
    closeArchivedWorkersModal();
}

// حذف عامل مؤرشف نهائياً
function deleteArchivedWorker(workerId) {
    if (!confirm('هل أنت متأكد من الحذف النهائي لهذا العامل؟\nهذا الإجراء لا يمكن التراجع عنه!')) {
        return;
    }

    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const filteredWorkers = workers.filter(w => w.id !== workerId);

    localStorage.setItem('workers', JSON.stringify(filteredWorkers));

    showSuccessMessage('تم حذف العامل نهائياً!', 'trash');
    showArchivedWorkers(); // إعادة تحميل قائمة المؤرشفين
    
    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();
}

// ===== دوال تقرير الإجمالي لكل العمال =====

// إظهار نموذج تقرير الإجمالي لكل العمال
function showAllWorkersReportForm() {
    document.getElementById('allWorkersReportModal').style.display = 'block';

    // تعيين التاريخ الافتراضي (الشهر الحالي)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('allWorkersReportFromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('allWorkersReportToDate').value = lastDay.toISOString().split('T')[0];
}

// إخفاء نموذج تقرير الإجمالي لكل العمال
function hideAllWorkersReportModal() {
    document.getElementById('allWorkersReportModal').style.display = 'none';
    document.getElementById('allWorkersReportContent').innerHTML = '';
    document.getElementById('printAllWorkersReportBtn').style.display = 'none';
    document.getElementById('printAllWorkersReportColoredBtn').style.display = 'none';
}

// إنشاء تقرير الإجمالي لكل العمال
function generateAllWorkersReport() {
    const fromDate = document.getElementById('allWorkersReportFromDate').value;
    const toDate = document.getElementById('allWorkersReportToDate').value;
    const includeInactive = document.getElementById('includeInactiveWorkers').checked;

    if (!fromDate || !toDate) {
        alert('يرجى تحديد الفترة الزمنية');
        return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
        alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
    }

    // جلب البيانات
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    // تصفية العمال
    let contractorWorkers = workers.filter(w => w.contractorId === currentContractor.id);
    if (!includeInactive) {
        contractorWorkers = contractorWorkers.filter(w => w.active && !w.archived);
    }

    // تصفية سجلات الحضور حسب الفترة
    const periodAttendance = attendance.filter(a =>
        a.contractorId === currentContractor.id &&
        a.date >= fromDate &&
        a.date <= toDate
    );

    // حساب الإجماليات لكل عامل
    const workersData = contractorWorkers.map(worker => {
        const workerAttendance = periodAttendance.filter(a => a.workerId === worker.id);

        const totalWorkDays = workerAttendance.reduce((sum, a) => sum + (a.workDay || 0), 0);
        const totalOvertimeHours = workerAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
        const totalAdvances = workerAttendance.reduce((sum, a) => sum + (a.advance || 0), 0);
        const totalSmokingCosts = workerAttendance.reduce((sum, a) => sum + (a.smokingCosts || 0), 0);
        const totalNetSalary = workerAttendance.reduce((sum, a) => sum + (a.netDaily || 0), 0);

        // الحصول على الورشة الأكثر استخداماً
        const workshopCounts = {};
        workerAttendance.forEach(a => {
            if (a.workshopId) {
                workshopCounts[a.workshopId] = (workshopCounts[a.workshopId] || 0) + 1;
            }
        });

        let mostUsedWorkshopId = null;
        let maxCount = 0;
        for (const [workshopId, count] of Object.entries(workshopCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostUsedWorkshopId = parseInt(workshopId);
            }
        }

        const workshop = workshops.find(w => w.id === mostUsedWorkshopId);

        return {
            worker,
            workshop: workshop ? workshop.name : worker.workshopId ? workshops.find(w => w.id === worker.workshopId)?.name || 'غير محدد' : 'غير محدد',
            totalWorkDays,
            totalOvertimeHours,
            totalAdvances,
            totalSmokingCosts,
            totalNetSalary,
            attendanceCount: workerAttendance.length
        };
    });

    // ترتيب العمال حسب إجمالي الراتب (تنازلي)
    workersData.sort((a, b) => b.totalNetSalary - a.totalNetSalary);

    // إنشاء HTML للتقرير
    let reportHTML = `
        <div class="report-header">
            <h2><i class="fas fa-chart-line"></i> تقرير الإجمالي لكل العمال</h2>
            <div class="report-info">
                <p><strong>المقاول:</strong> ${currentContractor.name}</p>
                <p><strong>الفترة:</strong> من ${new Date(fromDate).toLocaleDateString('ar')} إلى ${new Date(toDate).toLocaleDateString('ar')}</p>
                <p><strong>عدد العمال:</strong> ${workersData.length} عامل</p>
                <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar')}</p>
            </div>
        </div>

        <table class="report-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>اسم العامل</th>
                    <th>رقم العامل</th>
                    <th>الورشة</th>
                    <th>أيام العمل</th>
                    <th>الساعات الإضافية</th>
                    <th>إجمالي السلف</th>
                    <th>إجمالي الدخان</th>
                    <th>الراتب الشهري</th>
                </tr>
            </thead>
            <tbody>
    `;

    let grandTotalWorkDays = 0;
    let grandTotalOvertimeHours = 0;
    let grandTotalAdvances = 0;
    let grandTotalSmokingCosts = 0;
    let grandTotalNetSalary = 0;

    workersData.forEach((data, index) => {
        grandTotalWorkDays += data.totalWorkDays;
        grandTotalOvertimeHours += data.totalOvertimeHours;
        grandTotalAdvances += data.totalAdvances;
        grandTotalSmokingCosts += data.totalSmokingCosts;
        grandTotalNetSalary += data.totalNetSalary;

        reportHTML += `
            <tr>
                <td>${index + 1}</td>
                <td class="worker-name">${data.worker.name}</td>
                <td>${data.worker.number || '-'}</td>
                <td>${data.workshop}</td>
                <td>${data.totalWorkDays}</td>
                <td>${data.totalOvertimeHours.toFixed(1)}</td>
                <td>${data.totalAdvances.toFixed(2)} ₪</td>
                <td>${data.totalSmokingCosts.toFixed(2)} ₪</td>
                <td class="salary-amount">${data.totalNetSalary.toFixed(2)} ₪</td>
            </tr>
        `;
    });

    // صف الإجمالي العام
    reportHTML += `
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="4"><strong>الإجمالي العام</strong></td>
                    <td><strong>${grandTotalWorkDays}</strong></td>
                    <td><strong>${grandTotalOvertimeHours.toFixed(1)}</strong></td>
                    <td><strong style="color: rgb(255,152,0);">${grandTotalAdvances.toFixed(2)} ₪</strong></td>
                    <td><strong style="color: rgb(255,152,0);">${grandTotalSmokingCosts.toFixed(2)} ₪</strong></td>
                    <td><strong style="color: rgb(55,153,0);">${grandTotalNetSalary.toFixed(2)} ₪</strong></td>
                </tr>
            </tfoot>
        </table>

        <div class="report-summary">
            <div class="summary-card">
                <h4>ملخص التقرير</h4>
                <ul>
                    <li><strong>إجمالي أيام العمل:</strong> ${grandTotalWorkDays} يوم</li>
                    <li><strong>إجمالي الساعات الإضافية:</strong> ${grandTotalOvertimeHours.toFixed(1)} ساعة</li>
                    <li><strong>إجمالي السلف:</strong> ${grandTotalAdvances.toFixed(2)} ₪</li>
                    <li><strong>إجمالي تكاليف الدخان:</strong> ${grandTotalSmokingCosts.toFixed(2)} ₪</li>
                    <li><strong>إجمالي الرواتب:</strong> ${grandTotalNetSalary.toFixed(2)} ₪</li>
                    <li><strong>متوسط الراتب للعامل:</strong> ${workersData.length > 0 ? (grandTotalNetSalary / workersData.length).toFixed(2) : 0} ₪</li>
                </ul>
            </div>
        </div>
    `;

    // عرض التقرير
    document.getElementById('allWorkersReportContent').innerHTML = reportHTML;
    document.getElementById('printAllWorkersReportBtn').style.display = 'inline-block';
    document.getElementById('printAllWorkersReportColoredBtn').style.display = 'inline-block';
}

// طباعة تقرير الإجمالي لكل العمال
function printAllWorkersReport() {
    const reportContent = document.getElementById('allWorkersReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير الإجمالي لكل العمال</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                .report-table th { background-color: #f5f5f5; font-weight: bold; }
                .total-row { background-color: #e8f5e8; font-weight: bold; }
                .worker-name { font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .salary-amount { font-weight: bold; }
                .report-header { text-align: center; margin-bottom: 30px; }
                .report-info { margin: 20px 0; }
                .report-summary { margin-top: 30px; }
                .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// طباعة تقرير الإجمالي لكل العمال ملون
function printAllWorkersReportColored() {
    const reportContent = document.getElementById('allWorkersReportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير الإجمالي لكل العمال - ملون</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                .report-table th { background-color: #4CAF50; color: white; font-weight: bold; }
                .report-table tr:nth-child(even) { background-color: #f9f9f9; }
                .total-row { background-color: #2196F3; color: white; font-weight: bold; }
                .worker-name { font-weight: bold; color: #2c3e50; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
                .salary-amount { font-weight: bold; color: #27ae60; }
                .report-header { text-align: center; margin-bottom: 30px; color: #2c3e50; }
                .report-info { margin: 20px 0; background-color: #ecf0f1; padding: 15px; border-radius: 5px; }
                .report-summary { margin-top: 30px; }
                .summary-card { border: 1px solid #3498db; padding: 15px; border-radius: 5px; background-color: #ebf3fd; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${reportContent}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initPage();
    setupEditExpenseModal();
});

// تحميل صفحة العمال براتب ثابت
function loadFixedSalaryPage() {
    const pageContent = document.getElementById('fixed-salaryContent');
    
    pageContent.innerHTML = `
        <div class="workers-page-full">
            <div class="workers-header">
                <div class="workers-title">
                    <h2><i class="fas fa-money-bill-wave"></i> إدارة العمال براتب ثابت</h2>
                    <p>إدارة العمال الذين يتقاضون راتب شهري ثابت</p>
                </div>
                <div class="workers-actions">
                    <button class="btn success" onclick="showAddFixedSalaryWorkerModal()">
                        <i class="fas fa-plus"></i> إضافة عامل براتب ثابت
                    </button>
                    <button class="btn warning" onclick="showAddExpenseModal()">
                        <i class="fas fa-receipt"></i> إضافة مصروف
                    </button>
                    <button class="btn primary" onclick="showFixedSalaryReportModal()">
                        <i class="fas fa-file-pdf"></i> تقرير الراتب الثابت
                    </button>
                    <button class="btn" onclick="refreshFixedSalaryData()">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                </div>
            </div>

            <div class="workers-table-section-full">
                <div class="table-header">
                    <h3><i class="fas fa-table"></i> قائمة العمال براتب ثابت</h3>
                </div>
                <div class="table-container">
                    <table class="data-table workers-full-table">
                        <thead>
                            <tr>
                                <th>اسم العامل</th>
                                <th>الهوية/رقم العامل</th>
                                <th>الراتب الشهري</th>
                                <th>التخصص</th>
                                <th>تاريخ البداية</th>
                                <th>الحالة</th>
                                <th>ملاحظات</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="fixedSalaryWorkersTableBody">
                            <!-- سيتم ملؤها من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- جدول المصاريف -->
            <div class="workers-table-section-full">
                <div class="table-header">
                    <h3><i class="fas fa-receipt"></i> مصاريف الرواتب الثابتة</h3>
                </div>
                <div class="table-container">
                    <table class="data-table workers-full-table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>نوع المصروف</th>
                                <th>الوصف</th>
                                <th>المبلغ</th>
                                <th>العامل المرتبط</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="fixedSalaryExpensesTableBody">
                            <!-- سيتم ملؤها من JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- نموذج إضافة عامل براتب ثابت -->
        <div id="addFixedSalaryWorkerModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> إضافة عامل براتب ثابت</h3>
                    <button class="close" onclick="hideAddFixedSalaryWorkerModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="addFixedSalaryWorkerForm" onsubmit="addFixedSalaryWorker(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fixedWorkerName">اسم العامل *</label>
                            <input type="text" id="fixedWorkerName" required>
                        </div>
                        <div class="form-group">
                            <label for="fixedWorkerIdNumber">رقم الهوية/العامل *</label>
                            <input type="text" id="fixedWorkerIdNumber" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fixedWorkerSalary">الراتب الشهري (شيكل) *</label>
                            <input type="number" id="fixedWorkerSalary" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="fixedWorkerSpecialty">التخصص</label>
                            <input type="text" id="fixedWorkerSpecialty" placeholder="مثل: مهندس، محاسب، إداري">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fixedWorkerStartDate">تاريخ البداية</label>
                            <input type="date" id="fixedWorkerStartDate">
                        </div>
                        <div class="form-group">
                            <label for="fixedWorkerStatus">الحالة</label>
                            <select id="fixedWorkerStatus">
                                <option value="active">نشط</option>
                                <option value="inactive">غير نشط</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="fixedWorkerNotes">ملاحظات</label>
                        <textarea id="fixedWorkerNotes" rows="3" placeholder="أي ملاحظات إضافية..."></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ العامل
                        </button>
                        <button type="button" class="btn secondary" onclick="hideAddFixedSalaryWorkerModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- نموذج إضافة مصروف -->
        <div id="addExpenseModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> إضافة مصروف</h3>
                    <button class="close" onclick="hideAddExpenseModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="addExpenseForm" onsubmit="addFixedSalaryExpense(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expenseDate">التاريخ *</label>
                            <input type="date" id="expenseDate" required>
                        </div>
                        <div class="form-group">
                            <label for="expenseType">نوع المصروف *</label>
                            <select id="expenseType" required>
                                <option value="">اختر نوع المصروف</option>
                                <option value="salary">راتب شهري</option>
                                <option value="bonus">مكافأة</option>
                                <option value="allowance">بدل</option>
                                <option value="overtime">ساعات إضافية</option>
                                <option value="deduction">خصم</option>
                                <option value="advance">سلفة</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expenseAmount">المبلغ (شيكل) *</label>
                            <input type="number" id="expenseAmount" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="expenseWorker">العامل المرتبط</label>
                            <select id="expenseWorker">
                                <option value="">عام - غير مرتبط بعامل محدد</option>
                                <!-- سيتم ملؤها من JavaScript -->
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="expenseDescription">الوصف *</label>
                        <textarea id="expenseDescription" rows="3" placeholder="وصف المصروف..." required></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-save"></i> حفظ المصروف
                        </button>
                        <button type="button" class="btn secondary" onclick="hideAddExpenseModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- نافذة تقرير الراتب الثابت -->
        <div id="fixedSalaryReportModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-file-pdf"></i> تقرير الراتب الثابت</h3>
                    <button class="close" onclick="hideFixedSalaryReportModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="fixedSalaryReportForm" onsubmit="generateFixedSalaryReport(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reportFromDate">من تاريخ *</label>
                            <input type="date" id="reportFromDate" required>
                        </div>
                        <div class="form-group">
                            <label for="reportToDate">إلى تاريخ *</label>
                            <input type="date" id="reportToDate" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>اختيار العمال</label>
                        <div style="margin-bottom: 10px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: normal;">
                                <input type="checkbox" id="selectAllWorkers" onchange="toggleAllWorkers()" checked>
                                <span>تحديد الجميع</span>
                            </label>
                        </div>
                        <div id="workersCheckboxList" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
                            <!-- سيتم ملؤها من JavaScript -->
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: normal;">
                            <input type="checkbox" id="includeGeneralExpenses" checked>
                            <span>تضمين المصاريف العامة</span>
                        </label>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn success">
                            <i class="fas fa-file-pdf"></i> إنشاء التقرير
                        </button>
                        <button type="button" class="btn secondary" onclick="hideFixedSalaryReportModal()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // تحميل بيانات العمال براتب ثابت
    loadFixedSalaryWorkers();
    loadFixedSalaryExpenses();
}

// تحميل العمال براتب ثابت
function loadFixedSalaryWorkers() {
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    
    console.log('🔍 تحميل العمال براتب ثابت:');
    console.log('- المقاول الحالي:', currentContractor?.id, currentContractor?.name);
    console.log('- جميع العمال براتب ثابت:', fixedSalaryWorkers);
    
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);
    console.log('- عمال المقاول الحالي:', contractorWorkers);
    
    const tbody = document.getElementById('fixedSalaryWorkersTableBody');

    if (contractorWorkers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <i class="fas fa-users"></i><br>
                    لا يوجد عمال براتب ثابت مسجلين حالياً
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = contractorWorkers.map(worker => `
        <tr>
            <td>${worker.name}</td>
            <td>${worker.idNumber}</td>
            <td>${worker.salary.toLocaleString()} ₪</td>
            <td>${worker.specialty || '-'}</td>
            <td>${worker.startDate ? new Date(worker.startDate).toLocaleDateString('ar') : '-'}</td>
            <td>
                <span class="status-badge ${worker.status}">
                    ${worker.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${worker.notes || '-'}</td>
            <td class="action-buttons">
                <button class="btn small success" onclick="showAddExpenseModalForWorker(${worker.id}, '${worker.name}')" title="إضافة مصروف">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn small" onclick="editFixedSalaryWorker(${worker.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small danger" onclick="deleteFixedSalaryWorker(${worker.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// إظهار نموذج إضافة عامل براتب ثابت
function showAddFixedSalaryWorkerModal() {
    document.getElementById('addFixedSalaryWorkerModal').style.display = 'block';
    // تعيين تاريخ اليوم كتاريخ افتراضي
    document.getElementById('fixedWorkerStartDate').value = new Date().toISOString().split('T')[0];
}

// إخفاء نموذج إضافة عامل براتب ثابت
function hideAddFixedSalaryWorkerModal() {
    document.getElementById('addFixedSalaryWorkerModal').style.display = 'none';
    resetFixedSalaryWorkerForm();
}

// إضافة عامل براتب ثابت
function addFixedSalaryWorker(event) {
    event.preventDefault();

    console.log('💼 إضافة عامل براتب ثابت للمقاول:', currentContractor?.id, currentContractor?.name);

    const workerData = {
        id: Date.now(),
        contractorId: currentContractor.id,
        name: document.getElementById('fixedWorkerName').value,
        idNumber: document.getElementById('fixedWorkerIdNumber').value,
        salary: parseFloat(document.getElementById('fixedWorkerSalary').value),
        specialty: document.getElementById('fixedWorkerSpecialty').value,
        startDate: document.getElementById('fixedWorkerStartDate').value,
        status: document.getElementById('fixedWorkerStatus').value,
        notes: document.getElementById('fixedWorkerNotes').value,
        createdAt: new Date().toISOString()
    };

    console.log('📝 بيانات العامل الجديد:', workerData);

    // حفظ في localStorage
    let fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    fixedSalaryWorkers.push(workerData);
    localStorage.setItem('fixedSalaryWorkers', JSON.stringify(fixedSalaryWorkers));

    console.log('💾 تم حفظ العامل، جميع العمال الآن:', fixedSalaryWorkers);

    // إخفاء النموذج وإعادة تحميل البيانات
    hideAddFixedSalaryWorkerModal();
    loadFixedSalaryWorkers();
    
    // تحديث إحصائيات اللوحة الرئيسية
    updateDashboardStats();

    alert('تم إضافة العامل براتب ثابت بنجاح');
}

// حذف عامل براتب ثابت
function deleteFixedSalaryWorker(workerId) {
    if (confirm('هل أنت متأكد من حذف هذا العامل؟')) {
        let fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
        fixedSalaryWorkers = fixedSalaryWorkers.filter(w => w.id !== workerId);
        localStorage.setItem('fixedSalaryWorkers', JSON.stringify(fixedSalaryWorkers));
        
        loadFixedSalaryWorkers();
        alert('تم حذف العامل بنجاح');
        
        // تحديث إحصائيات اللوحة الرئيسية
        updateDashboardStats();
    }
}

// تحديث بيانات العمال براتب ثابت
function refreshFixedSalaryData() {
    loadFixedSalaryWorkers();
    alert('تم تحديث البيانات');
}

// تعديل عامل براتب ثابت
function editFixedSalaryWorker(workerId) {
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const worker = fixedSalaryWorkers.find(w => w.id === workerId);
    
    if (!worker) {
        alert('العامل غير موجود');
        return;
    }

    // ملء النموذج ببيانات العامل
    document.getElementById('fixedWorkerName').value = worker.name;
    document.getElementById('fixedWorkerIdNumber').value = worker.idNumber;
    document.getElementById('fixedWorkerSalary').value = worker.salary;
    document.getElementById('fixedWorkerSpecialty').value = worker.specialty || '';
    document.getElementById('fixedWorkerStartDate').value = worker.startDate || '';
    document.getElementById('fixedWorkerStatus').value = worker.status;
    document.getElementById('fixedWorkerNotes').value = worker.notes || '';

    // تحديد حقل الاسم وتركيز عليه
    const nameInput = document.getElementById('fixedWorkerName');
    nameInput.focus();
    nameInput.select(); // تحديد النص لسهولة التعديل

    // تغيير عنوان النموذج وإظهاره
    document.querySelector('#addFixedSalaryWorkerModal .modal-header h3').innerHTML = 
        `<i class="fas fa-edit"></i> تعديل عامل براتب ثابت: ${worker.name}`;
    
    // تغيير دالة الإرسال
    const form = document.getElementById('addFixedSalaryWorkerForm');
    form.onsubmit = function(event) {
        updateFixedSalaryWorker(event, workerId);
    };

    // إظهار النموذج
    showAddFixedSalaryWorkerModal();
}

// تحديث بيانات عامل براتب ثابت
function updateFixedSalaryWorker(event, workerId) {
    event.preventDefault();

    const workerData = {
        name: document.getElementById('fixedWorkerName').value,
        idNumber: document.getElementById('fixedWorkerIdNumber').value,
        salary: parseFloat(document.getElementById('fixedWorkerSalary').value),
        specialty: document.getElementById('fixedWorkerSpecialty').value,
        startDate: document.getElementById('fixedWorkerStartDate').value,
        status: document.getElementById('fixedWorkerStatus').value,
        notes: document.getElementById('fixedWorkerNotes').value,
        updatedAt: new Date().toISOString()
    };

    // تحديث البيانات في localStorage
    let fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const workerIndex = fixedSalaryWorkers.findIndex(w => w.id === workerId);
    
    if (workerIndex !== -1) {
        fixedSalaryWorkers[workerIndex] = { ...fixedSalaryWorkers[workerIndex], ...workerData };
        localStorage.setItem('fixedSalaryWorkers', JSON.stringify(fixedSalaryWorkers));
        
        // إعادة تعيين النموذج
        resetFixedSalaryWorkerForm();
        hideAddFixedSalaryWorkerModal();
        loadFixedSalaryWorkers();
        
        // تحديث إحصائيات اللوحة الرئيسية
        updateDashboardStats();
        
        alert('تم تحديث بيانات العامل بنجاح');
    } else {
        alert('حدث خطأ في تحديث البيانات');
    }
}

// إعادة تعيين النموذج لحالة الإضافة
function resetFixedSalaryWorkerForm() {
    document.querySelector('#addFixedSalaryWorkerModal .modal-header h3').innerHTML = 
        '<i class="fas fa-plus"></i> إضافة عامل براتب ثابت';
    
    const form = document.getElementById('addFixedSalaryWorkerForm');
    form.onsubmit = function(event) {
        addFixedSalaryWorker(event);
    };
    
    form.reset();
}

// === دوال إدارة المصاريف ===

// تحميل مصاريف الرواتب الثابتة
function loadFixedSalaryExpenses() {
    const expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
    const contractorExpenses = expenses.filter(e => e.contractorId === currentContractor.id);
    const tbody = document.getElementById('fixedSalaryExpensesTableBody');

    if (contractorExpenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <i class="fas fa-receipt"></i><br>
                    لا توجد مصاريف مسجلة حالياً
                </td>
            </tr>
        `;
        return;
    }

    // جلب أسماء العمال للربط
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);

    // تجميع المصاريف حسب العامل
    const expensesByWorker = {};
    
    contractorExpenses.forEach(expense => {
        const workerId = expense.workerId || 'general';
        if (!expensesByWorker[workerId]) {
            expensesByWorker[workerId] = [];
        }
        expensesByWorker[workerId].push(expense);
    });

    let htmlContent = '';

    // عرض المصاريف العامة أولاً
    if (expensesByWorker['general']) {
        htmlContent += `
            <tr class="worker-header">
                <td colspan="6" style="background: #f8f9fa; font-weight: bold; text-align: center;">
                    <i class="fas fa-receipt"></i> مصاريف عامة
                </td>
            </tr>
        `;
        
        expensesByWorker['general'].forEach(expense => {
            htmlContent += createExpenseRow(expense);
        });

        // إجمالي المصاريف العامة
        const generalTotal = expensesByWorker['general'].reduce((sum, exp) => sum + exp.amount, 0);
        htmlContent += `
            <tr class="total-row">
                <td colspan="3" style="text-align: right; font-weight: bold;">إجمالي المصاريف العامة:</td>
                <td style="font-weight: bold; color: #dc3545;">-${generalTotal.toLocaleString()} ₪</td>
                <td colspan="2"></td>
            </tr>
        `;
    }

    // عرض مصاريف كل عامل
    contractorWorkers.forEach(worker => {
        const workerExpenses = expensesByWorker[worker.id.toString()];
        if (workerExpenses && workerExpenses.length > 0) {
            htmlContent += `
                <tr class="worker-header">
                    <td colspan="6" style="background: #e3f2fd; font-weight: bold; text-align: center;">
                        <i class="fas fa-user"></i> العامل: ${worker.name} - الراتب الأساسي: ${worker.salary.toLocaleString()} ₪
                    </td>
                </tr>
            `;
            
            workerExpenses.forEach(expense => {
                htmlContent += createExpenseRow(expense);
            });

            // إجمالي مصاريف العامل
            const workerTotal = workerExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const finalSalary = worker.salary - workerTotal; // تغيير من + إلى -
            
            htmlContent += `
                <tr class="total-row">
                    <td colspan="3" style="text-align: right; font-weight: bold;">إجمالي المصاريف:</td>
                    <td style="font-weight: bold; color: #dc3545;">-${workerTotal.toLocaleString()} ₪</td>
                    <td colspan="2"></td>
                </tr>
                <tr class="final-salary-row">
                    <td colspan="3" style="text-align: right; font-weight: bold; color: ${finalSalary >= 0 ? '#28a745' : '#dc3545'};">صافي الراتب النهائي:</td>
                    <td style="font-weight: bold; color: ${finalSalary >= 0 ? '#28a745' : '#dc3545'}; font-size: 1.1em;">${finalSalary.toLocaleString()} ₪</td>
                    <td colspan="2"></td>
                </tr>
                <tr><td colspan="6" style="height: 10px; border: none;"></td></tr>
            `;
        }
    });

    tbody.innerHTML = htmlContent;
}

// إنشاء صف مصروف
function createExpenseRow(expense) {
    const expenseTypes = {
        'salary': 'راتب شهري',
        'bonus': 'مكافأة',
        'allowance': 'بدل',
        'overtime': 'ساعات إضافية',
        'deduction': 'خصم',
        'advance': 'سلفة',
        'other': 'أخرى'
    };

    // جميع المصاريف تظهر كخصومات بلون أحمر وعلامة ناقص
    const amountColor = '#dc3545';
    const amountSign = '-';

    return `
        <tr>
            <td>${new Date(expense.date).toLocaleDateString('ar')}</td>
            <td>${expenseTypes[expense.type] || expense.type}</td>
            <td>${expense.description}</td>
            <td style="color: ${amountColor};">${amountSign}${expense.amount.toLocaleString()} ₪</td>
            <td>-</td>
            <td class="action-buttons">
                <button class="btn small" onclick="editFixedSalaryExpense(${expense.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small danger" onclick="deleteFixedSalaryExpense(${expense.id})" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// إظهار نموذج إضافة مصروف لعامل معين
function showAddExpenseModalForWorker(workerId, workerName) {
    // تحديث قائمة العمال في النموذج
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);
    
    const workerSelect = document.getElementById('expenseWorker');
    workerSelect.innerHTML = '<option value="">عام - غير مرتبط بعامل محدد</option>';
    
    contractorWorkers.forEach(worker => {
        workerSelect.innerHTML += `<option value="${worker.id}">${worker.name}</option>`;
    });

    // تحديد العامل المحدد
    workerSelect.value = workerId;
    
    // تعيين التاريخ الحالي
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    // تغيير عنوان النموذج
    document.querySelector('#addExpenseModal .modal-header h3').innerHTML = 
        `<i class="fas fa-receipt"></i> إضافة مصروف للعامل: ${workerName}`;
    
    document.getElementById('addExpenseModal').style.display = 'block';
}

// إظهار نموذج إضافة مصروف
function showAddExpenseModal() {
    // تحديث قائمة العمال في النموذج
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);
    
    const workerSelect = document.getElementById('expenseWorker');
    workerSelect.innerHTML = '<option value="">عام - غير مرتبط بعامل محدد</option>';
    
    contractorWorkers.forEach(worker => {
        workerSelect.innerHTML += `<option value="${worker.id}">${worker.name}</option>`;
    });

    // تعيين التاريخ الحالي
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    // إعادة تعيين عنوان النموذج للوضع العام
    document.querySelector('#addExpenseModal .modal-header h3').innerHTML = 
        '<i class="fas fa-receipt"></i> إضافة مصروف';
    
    document.getElementById('addExpenseModal').style.display = 'block';
}

// إخفاء نموذج إضافة مصروف
function hideAddExpenseModal() {
    document.getElementById('addExpenseModal').style.display = 'none';
    document.getElementById('addExpenseForm').reset();
    
    // إعادة تفعيل حقل العامل
    const workerSelect = document.getElementById('expenseWorker');
    workerSelect.disabled = false;
    workerSelect.style.backgroundColor = '';
    workerSelect.style.cursor = '';
    
    // إعادة تعيين دالة الإرسال للوضع العادي
    const form = document.getElementById('addExpenseForm');
    form.onsubmit = function(event) {
        addFixedSalaryExpense(event);
    };
}

// إظهار نافذة تقرير الراتب الثابت
function showFixedSalaryReportModal() {
    // تعيين التواريخ الافتراضية (الشهر الحالي)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('reportFromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportToDate').value = lastDay.toISOString().split('T')[0];
    
    // تحميل قائمة العمال
    loadWorkersCheckboxList();
    
    document.getElementById('fixedSalaryReportModal').style.display = 'block';
}

// إخفاء نافذة تقرير الراتب الثابت
function hideFixedSalaryReportModal() {
    document.getElementById('fixedSalaryReportModal').style.display = 'none';
    document.getElementById('fixedSalaryReportForm').reset();
}

// تحميل قائمة العمال مع checkboxes
function loadWorkersCheckboxList() {
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);
    
    const container = document.getElementById('workersCheckboxList');
    
    if (contractorWorkers.length === 0) {
        container.innerHTML = '<p style="color: #6c757d; font-style: italic;">لا توجد عمال براتب ثابت</p>';
        return;
    }
    
    container.innerHTML = contractorWorkers.map(worker => `
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: normal; cursor: pointer;">
            <input type="checkbox" class="worker-checkbox" value="${worker.id}" checked onchange="updateSelectAllState()">
            <span>${worker.name} - ${worker.salary.toLocaleString()} ₪</span>
        </label>
    `).join('');
}

// تبديل تحديد جميع العمال
function toggleAllWorkers() {
    const selectAll = document.getElementById('selectAllWorkers');
    const checkboxes = document.querySelectorAll('.worker-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// تحديث حالة "تحديد الجميع"
function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.worker-checkbox');
    const selectAll = document.getElementById('selectAllWorkers');
    
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);
    
    if (allChecked) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else if (noneChecked) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    }
}

// إضافة مصروف جديد
function addFixedSalaryExpense(event) {
    event.preventDefault();

    const expenseData = {
        id: Date.now(),
        contractorId: currentContractor.id,
        date: document.getElementById('expenseDate').value,
        type: document.getElementById('expenseType').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        workerId: document.getElementById('expenseWorker').value || null,
        description: document.getElementById('expenseDescription').value,
        createdAt: new Date().toISOString()
    };

    // حفظ في localStorage
    let expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
    expenses.push(expenseData);
    localStorage.setItem('fixedSalaryExpenses', JSON.stringify(expenses));

    // إخفاء النموذج وإعادة تحميل البيانات
    hideAddExpenseModal();
    loadFixedSalaryExpenses();

    alert('تم إضافة المصروف بنجاح');
}

// حذف مصروف
function deleteFixedSalaryExpense(expenseId) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        let expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
        expenses = expenses.filter(e => e.id !== expenseId);
        localStorage.setItem('fixedSalaryExpenses', JSON.stringify(expenses));
        
        loadFixedSalaryExpenses();
        alert('تم حذف المصروف بنجاح');
    }
}

// تعديل مصروف
function editFixedSalaryExpense(expenseId) {
    const expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
    const expense = expenses.find(e => e.id === expenseId);
    
    if (!expense) {
        alert('المصروف غير موجود');
        return;
    }

    // تحديث قائمة العمال في النموذج
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const contractorWorkers = fixedSalaryWorkers.filter(w => w.contractorId === currentContractor.id);
    
    const workerSelect = document.getElementById('expenseWorker');
    workerSelect.innerHTML = '<option value="">عام - غير مرتبط بعامل محدد</option>';
    
    contractorWorkers.forEach(worker => {
        workerSelect.innerHTML += `<option value="${worker.id}">${worker.name}</option>`;
    });

    // ملء النموذج ببيانات المصروف
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseType').value = expense.type;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseWorker').value = expense.workerId || '';
    document.getElementById('expenseDescription').value = expense.description;

    // تعطيل حقل العامل عند التعديل
    workerSelect.disabled = true;
    workerSelect.style.backgroundColor = '#f8f9fa';
    workerSelect.style.cursor = 'not-allowed';

    // تحديد حقل الوصف وتركيز عليه
    const descriptionInput = document.getElementById('expenseDescription');
    descriptionInput.focus();
    descriptionInput.select(); // تحديد النص لسهولة التعديل

    // تغيير عنوان النموذج
    const expenseTypes = {
        'salary': 'راتب شهري',
        'bonus': 'مكافأة',
        'allowance': 'بدل',
        'overtime': 'ساعات إضافية',
        'deduction': 'خصم',
        'advance': 'سلفة',
        'other': 'أخرى'
    };
    
    // العثور على اسم العامل إذا كان مرتبطاً
    const worker = contractorWorkers.find(w => w.id == expense.workerId);
    const workerName = worker ? ` (${worker.name})` : '';
    
    document.querySelector('#addExpenseModal .modal-header h3').innerHTML = 
        `<i class="fas fa-edit"></i> تعديل مصروف: ${expenseTypes[expense.type] || expense.type}${workerName}`;
    
    // تغيير دالة الإرسال
    const form = document.getElementById('addExpenseForm');
    form.onsubmit = function(event) {
        updateFixedSalaryExpense(event, expenseId);
    };

    // إظهار النموذج
    document.getElementById('addExpenseModal').style.display = 'block';
}

// تحديث مصروف
function updateFixedSalaryExpense(event, expenseId) {
    event.preventDefault();

    const expenseData = {
        date: document.getElementById('expenseDate').value,
        type: document.getElementById('expenseType').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        workerId: document.getElementById('expenseWorker').value || null,
        description: document.getElementById('expenseDescription').value,
        updatedAt: new Date().toISOString()
    };

    // تحديث البيانات
    let expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
    const expenseIndex = expenses.findIndex(e => e.id === expenseId);
    
    if (expenseIndex !== -1) {
        expenses[expenseIndex] = { ...expenses[expenseIndex], ...expenseData };
        localStorage.setItem('fixedSalaryExpenses', JSON.stringify(expenses));
        
        // إعادة تعيين النموذج
        resetExpenseForm();
        hideAddExpenseModal();
        loadFixedSalaryExpenses();
        
        alert('تم تحديث المصروف بنجاح');
    } else {
        alert('حدث خطأ في تحديث البيانات');
    }
}

// إعادة تعيين نموذج المصروف
function resetExpenseForm() {
    document.querySelector('#addExpenseModal .modal-header h3').innerHTML = 
        '<i class="fas fa-receipt"></i> إضافة مصروف';
    
    const form = document.getElementById('addExpenseForm');
    form.onsubmit = function(event) {
        addFixedSalaryExpense(event);
    };
}

// تحديث البيانات (تضمين المصاريف)
function refreshFixedSalaryData() {
    loadFixedSalaryWorkers();
    loadFixedSalaryExpenses();
    alert('تم تحديث البيانات');
}

// إنشاء تقرير الراتب الثابت
function generateFixedSalaryReport(event) {
    event.preventDefault();
    
    const fromDate = document.getElementById('reportFromDate').value;
    const toDate = document.getElementById('reportToDate').value;
    const includeGeneralExpenses = document.getElementById('includeGeneralExpenses').checked;
    
    // الحصول على العمال المحددين
    const selectedWorkerIds = Array.from(document.querySelectorAll('.worker-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    
    if (selectedWorkerIds.length === 0) {
        alert('يرجى اختيار عامل واحد على الأقل');
        return;
    }
    
    // جلب البيانات
    const fixedSalaryWorkers = JSON.parse(localStorage.getItem('fixedSalaryWorkers')) || [];
    const expenses = JSON.parse(localStorage.getItem('fixedSalaryExpenses')) || [];
    
    const contractorWorkers = fixedSalaryWorkers.filter(w => 
        w.contractorId === currentContractor.id && selectedWorkerIds.includes(w.id)
    );
    
    // تصفية المصاريف حسب التاريخ
    const filteredExpenses = expenses.filter(expense => {
        if (expense.contractorId !== currentContractor.id) return false;
        
        const expenseDate = new Date(expense.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        return expenseDate >= from && expenseDate <= to;
    });
    
    if (contractorWorkers.length === 0) {
        alert('لا توجد بيانات للعمال المحددين');
        return;
    }
    
    // إنشاء التقرير
    generateReportHTML(contractorWorkers, filteredExpenses, fromDate, toDate, includeGeneralExpenses);
    
    // إخفاء النافذة المنبثقة
    hideFixedSalaryReportModal();
}

// إنشاء HTML للتقرير
function generateReportHTML(workers, expenses, fromDate, toDate, includeGeneralExpenses) {
    const reportWindow = window.open('', '_blank');
    
    // حساب الراتب الصافي لكل عامل
    const workersWithNetSalary = workers.map(worker => {
        const workerExpenses = expenses.filter(expense => expense.workerId == worker.id);
        const totalExpenses = workerExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netSalary = worker.salary - totalExpenses;
        
        return {
            ...worker,
            totalExpenses,
            netSalary,
            expenses: workerExpenses
        };
    });

    // المصاريف العامة
    const generalExpenses = includeGeneralExpenses ? 
        expenses.filter(exp => !exp.workerId) : [];
    const totalGeneralExpenses = generalExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // حساب الإجماليات
    const totalBasicSalaries = workers.reduce((sum, worker) => sum + worker.salary, 0);
    const totalExpenses = workersWithNetSalary.reduce((sum, worker) => sum + worker.totalExpenses, 0);
    const totalNetSalaries = workersWithNetSalary.reduce((sum, worker) => sum + worker.netSalary, 0);
    const grandTotal = totalNetSalaries - totalGeneralExpenses; // تصحيح: المصاريف العامة تُخصم

    const expenseTypes = {
        'salary': 'راتب شهري',
        'bonus': 'مكافأة',
        'allowance': 'بدل',
        'overtime': 'ساعات إضافية',
        'deduction': 'خصم',
        'advance': 'سلفة',
        'other': 'أخرى'
    };

    reportWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير الراتب الثابت - ${currentContractor.name}</title>
            <style>
                body { 
                    font-family: 'Cairo', 'Arial', sans-serif; 
                    margin: 20px; 
                    line-height: 1.6; 
                    color: #333;
                    direction: rtl;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 3px solid #007bff; 
                    padding: 20px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 8px;
                }
                .header h1 { color: #007bff; margin-bottom: 10px; }
                .header h2 { color: #495057; margin-bottom: 5px; }
                .period-info {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-right: 4px solid #ffc107;
                }
                .summary { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 25px;
                    border: 1px solid #dee2e6;
                }
                .summary-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 15px; 
                }
                .summary-item { 
                    background: white; 
                    padding: 15px; 
                    border-radius: 6px; 
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .summary-item h4 { color: #495057; margin-bottom: 8px; font-size: 0.9em; }
                .summary-item p { font-size: 1.2em; margin: 0; }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 25px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                th, td { 
                    border: 1px solid #dee2e6; 
                    padding: 12px 8px; 
                    text-align: right; 
                }
                th { 
                    background: linear-gradient(135deg, #495057 0%, #6c757d 100%); 
                    color: white; 
                    font-weight: bold;
                }
                .worker-section { 
                    margin-bottom: 30px; 
                    page-break-inside: avoid; 
                    border: 1px solid #dee2e6; 
                    border-radius: 8px; 
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .worker-header { 
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
                    color: white; 
                    padding: 15px; 
                    margin-bottom: 0; 
                }
                .worker-details { padding: 20px; background: white; }
                .net-positive { color: #28a745; font-weight: bold; }
                .net-negative { color: #dc3545; font-weight: bold; }
                .expense-deduction { color: #dc3545; }
                .total-row { 
                    background-color: #e9ecef; 
                    font-weight: bold; 
                }
                .final-total-row { 
                    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); 
                    font-weight: bold; 
                    font-size: 1.1em; 
                }
                .worker-expenses { 
                    background: #f8f9fa; 
                    margin: 15px 0; 
                    padding: 15px; 
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                }
                .general-expenses { 
                    background: #fff3cd; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 25px;
                    border: 1px solid #ffeaa7;
                }
                .no-print { 
                    margin-top: 30px; 
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .print-btn {
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 5px;
                    transition: all 0.3s ease;
                }
                .print-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,123,255,0.3);
                }
                .close-btn {
                    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 5px;
                }
                @media print { 
                    body { margin: 0; } 
                    .no-print { display: none; }
                    .worker-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 تقرير الراتب الثابت</h1>
                <h2>المقاول: ${currentContractor.name}</h2>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleDateString('ar')}</p>
            </div>

            <div class="period-info">
                <h3>📅 فترة التقرير</h3>
                <p><strong>من:</strong> ${new Date(fromDate).toLocaleDateString('ar')} 
                <strong>إلى:</strong> ${new Date(toDate).toLocaleDateString('ar')}</p>
                <p><strong>عدد العمال المحددين:</strong> ${workers.length} عامل</p>
            </div>

            <div class="summary">
                <h3>📈 ملخص عام</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <h4>عدد العمال</h4>
                        <p><strong>${workers.length}</strong></p>
                    </div>
                    <div class="summary-item">
                        <h4>إجمالي الرواتب الأساسية</h4>
                        <p><strong>${totalBasicSalaries.toLocaleString()} ₪</strong></p>
                    </div>
                    <div class="summary-item">
                        <h4>إجمالي المصاريف</h4>
                        <p><strong class="expense-deduction">${totalExpenses.toLocaleString()} ₪</strong></p>
                    </div>
                    <div class="summary-item">
                        <h4>صافي رواتب العمال</h4>
                        <p><strong class="net-positive">${totalNetSalaries.toLocaleString()} ₪</strong></p>
                    </div>
                    ${includeGeneralExpenses ? `
                        <div class="summary-item">
                            <h4>المصاريف العامة</h4>
                            <p><strong class="expense-deduction">${totalGeneralExpenses.toLocaleString()} ₪</strong></p>
                        </div>
                        <div class="summary-item" style="background: #d4edda;">
                            <h4>الإجمالي النهائي</h4>
                            <p><strong style="font-size: 1.3em;">${grandTotal.toLocaleString()} ₪</strong></p>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${includeGeneralExpenses && generalExpenses.length > 0 ? `
                <div class="general-expenses">
                    <h3>🧾 المصاريف العامة</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>النوع</th>
                                <th>الوصف</th>
                                <th>المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generalExpenses.map(expense => `
                                <tr>
                                    <td>${new Date(expense.date).toLocaleDateString('ar')}</td>
                                    <td>${expenseTypes[expense.type] || expense.type}</td>
                                    <td>${expense.description}</td>
                                    <td><strong class="expense-deduction">-${expense.amount.toLocaleString()} ₪</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="3"><strong>إجمالي المصاريف العامة</strong></td>
                                <td><strong class="expense-deduction">-${totalGeneralExpenses.toLocaleString()} ₪</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ` : ''}

            <h3>👥 تقرير مفصل لكل عامل</h3>
            
            ${workersWithNetSalary.map(worker => `
                <div class="worker-section">
                    <div class="worker-header">
                        <h4>👤 ${worker.name}</h4>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">
                            رقم الهوية: ${worker.idNumber} | 
                            التخصص: ${worker.specialty || '-'} |
                            الحالة: ${worker.status === 'active' ? 'نشط' : 'غير نشط'}
                        </p>
                    </div>
                    
                    <div class="worker-details">
                        <table>
                            <tr>
                                <th style="width: 40%;">البيان</th>
                                <th style="width: 60%;">القيمة</th>
                            </tr>
                            <tr>
                                <td>تاريخ البداية</td>
                                <td>${worker.startDate ? new Date(worker.startDate).toLocaleDateString('ar') : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>الراتب الأساسي</strong></td>
                                <td><strong>${worker.salary.toLocaleString()} ₪</strong></td>
                            </tr>
                            <tr>
                                <td><strong>إجمالي المصاريف</strong></td>
                                <td><strong class="expense-deduction">-${worker.totalExpenses.toLocaleString()} ₪</strong></td>
                            </tr>
                            <tr class="final-total-row">
                                <td><strong>صافي الراتب النهائي</strong></td>
                                <td><strong class="${worker.netSalary >= 0 ? 'net-positive' : 'net-negative'}">${worker.netSalary.toLocaleString()} ₪</strong></td>
                            </tr>
                        </table>

                        ${worker.expenses.length > 0 ? `
                            <div class="worker-expenses">
                                <h5>📋 تفاصيل المصاريف خلال الفترة:</h5>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>التاريخ</th>
                                            <th>النوع</th>
                                            <th>الوصف</th>
                                            <th>المبلغ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${worker.expenses.map(expense => `
                                            <tr>
                                                <td>${new Date(expense.date).toLocaleDateString('ar')}</td>
                                                <td>${expenseTypes[expense.type] || expense.type}</td>
                                                <td>${expense.description}</td>
                                                <td class="expense-deduction">-${expense.amount.toLocaleString()} ₪</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr class="total-row">
                                            <td colspan="3"><strong>إجمالي مصاريف العامل</strong></td>
                                            <td><strong class="expense-deduction">-${worker.totalExpenses.toLocaleString()} ₪</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ` : '<p style="color: #6c757d; font-style: italic; padding: 15px; background: #f8f9fa; border-radius: 6px;">ℹ️ لا توجد مصاريف لهذا العامل خلال الفترة المحددة</p>'}
                    </div>
                </div>
            `).join('')}

            <div class="summary">
                <h3>🧮 الإجماليات النهائية</h3>
                <table>
                    <tr>
                        <td><strong>إجمالي الرواتب الأساسية</strong></td>
                        <td><strong>${totalBasicSalaries.toLocaleString()} ₪</strong></td>
                    </tr>
                    <tr>
                        <td><strong>إجمالي مصاريف العمال</strong></td>
                        <td><strong class="expense-deduction">-${totalExpenses.toLocaleString()} ₪</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>صافي رواتب العمال</strong></td>
                        <td><strong class="net-positive">${totalNetSalaries.toLocaleString()} ₪</strong></td>
                    </tr>
                    ${includeGeneralExpenses ? `
                        <tr>
                            <td><strong>المصاريف العامة</strong></td>
                            <td><strong class="expense-deduction">-${totalGeneralExpenses.toLocaleString()} ₪</strong></td>
                        </tr>
                        <tr class="final-total-row">
                            <td><strong>الإجمالي النهائي الكامل</strong></td>
                            <td><strong style="font-size: 1.3em; color: ${grandTotal >= 0 ? '#28a745' : '#dc3545'};">${grandTotal.toLocaleString()} ₪</strong></td>
                        </tr>
                    ` : ''}
                </table>
            </div>

            <div class="no-print">
                <button onclick="window.print()" class="print-btn">
                    🖨️ طباعة التقرير
                </button>
                <button onclick="window.close()" class="close-btn">
                    ❌ إغلاق
                </button>
            </div>
        </body>
        </html>
    `);

    reportWindow.document.close();
}


