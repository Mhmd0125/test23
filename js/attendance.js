// تهيئة بيانات الحضور إذا لم تكن موجودة
if (!localStorage.getItem('attendance')) {
    localStorage.setItem('attendance', JSON.stringify([]));
}

// عناصر DOM
let attendanceForm;
let attendanceTableBody;
let workerSelect;
let workshopSelect;
let contractorSelect;

// متغيرات حالة
let currentAttendanceId = null;
let isEditing = false;

// تهيئة عناصر DOM عند تحميل الصفحة
function initAttendancePage() {
    attendanceForm = document.getElementById('attendanceForm');
    attendanceTableBody = document.getElementById('attendanceTableBody');
    workerSelect = document.getElementById('workerSelect');
    workshopSelect = document.getElementById('workshopSelect');
    contractorSelect = document.getElementById('contractorSelect');

    if (attendanceForm) {
        attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    }

    if (contractorSelect) {
        contractorSelect.addEventListener('change', handleContractorChange);
    }

    // تعيين تاريخ اليوم كقيمة افتراضية
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    populateContractorsDropdown();
    populateWorkshopsDropdown();
    renderAttendanceTable();
}

// تعبئة قائمة المقاولين
function populateContractorsDropdown() {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];

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

// معالجة تغيير المقاول
function handleContractorChange() {
    const contractorId = contractorSelect.value;

    if (!workerSelect) return;

    // مسح قائمة العمال
    workerSelect.innerHTML = '<option value="">اختر العامل</option>';

    if (!contractorId) {
        workerSelect.disabled = true;
        return;
    }

    // تفعيل قائمة العمال
    workerSelect.disabled = false;

    // تعبئة العمال للمقاول المحدد
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const contractorWorkers = workers.filter(worker =>
        worker.active && worker.contractorId == contractorId
    );

    contractorWorkers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = worker.name;
        option.dataset.dailyWage = worker.dailyWage;
        option.dataset.overtimeRate = worker.overtimeRate;
        option.dataset.workshopId = worker.workshopId || '';
        workerSelect.appendChild(option);
    });
}

// تعبئة قائمة العمال (للاستخدام في التصفية)
function populateWorkersDropdown() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const activeWorkers = workers.filter(worker => worker.active);

    if (!workerSelect) return;

    // مسح الخيارات الحالية
    workerSelect.innerHTML = '<option value="">اختر العامل</option>';

    // إضافة العمال
    activeWorkers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = `${worker.name} (${worker.contractorName || 'بدون مقاول'})`;
        option.dataset.dailyWage = worker.dailyWage;
        option.dataset.overtimeRate = worker.overtimeRate;
        option.dataset.workshopId = worker.workshopId || '';
        workerSelect.appendChild(option);
    });
}

// تعبئة قائمة الورش
function populateWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    
    // مسح الخيارات الحالية
    workshopSelect.innerHTML = '<option value="">اختر ورشة</option>';
    
    // إضافة الورش
    workshops.forEach(workshop => {
        const option = document.createElement('option');
        option.value = workshop.id;
        option.textContent = workshop.name;
        workshopSelect.appendChild(option);
    });
}

// تحديث الورشة تلقائياً عند اختيار العامل
function updateWorkshopFromWorker() {
    if (!workerSelect || !workshopSelect) return;

    const selectedOption = workerSelect.options[workerSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.workshopId) {
        workshopSelect.value = selectedOption.dataset.workshopId;
    }
}

// معالجة حفظ اليومية
function handleAttendanceSubmit(e) {
    e.preventDefault();

    const date = document.getElementById('attendanceDate').value;
    const workerId = workerSelect.value;
    const workshopId = workshopSelect.value;
    const attendanceStatus = document.getElementById('attendanceStatus').value;
    const overtimeHours = parseFloat(document.getElementById('overtimeHours').value) || 0;
    const advance = parseFloat(document.getElementById('advance').value) || 0;
    const smokingCost = parseFloat(document.getElementById('smokingCost').value) || 0;
    const notes = document.getElementById('attendanceNotes').value.trim();
    
    if (!date || !workerId) {
        alert('الرجاء اختيار التاريخ والعامل');
        return;
    }

    // الحصول على بيانات العامل
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const worker = workers.find(w => w.id == workerId);

    if (!worker) {
        alert('العامل المحدد غير موجود');
        return;
    }

    // الحصول على بيانات الورشة
    let workshop = null;
    if (workshopId) {
        const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
        workshop = workshops.find(w => w.id == workshopId);
    }

    // التحقق من عدم وجود تسجيل سابق لنفس العامل في نفس اليوم
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const existingAttendance = attendance.find(a =>
        a.workerId == workerId &&
        a.date === date &&
        (!isEditing || a.id !== currentAttendanceId)
    );

    if (existingAttendance) {
        alert('يوجد تسجيل سابق لهذا العامل في هذا التاريخ');
        return;
    }

    const attendanceData = {
        date,
        workerId: parseInt(workerId),
        workerName: worker.name,
        contractorId: worker.contractorId,
        contractorName: worker.contractorName,
        workshopId: workshop ? workshop.id : null,
        workshop: workshop ? workshop.name : '',
        attendanceStatus: attendanceStatus,
        overtime: overtimeHours,
        advance: advance,
        smoking: smokingCost,
        notes,
        dailyWage: worker.dailyWage,
        overtimeRate: worker.overtimeRate,
        timestamp: new Date().toISOString()
    };

    saveAttendance(attendanceData);
}

// حفظ اليومية في localStorage
function saveAttendance(attendanceData) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    if (isEditing && currentAttendanceId !== null) {
        // تحديث يومية موجودة
        const index = attendance.findIndex(a => a.id === currentAttendanceId);
        if (index !== -1) {
            attendance[index] = { ...attendance[index], ...attendanceData };
        }
    } else {
        // إضافة يومية جديدة
        const newId = attendance.length > 0 ? Math.max(...attendance.map(a => a.id || 0)) + 1 : 1;
        attendanceData.id = newId;
        attendance.push(attendanceData);
    }
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    attendanceForm.reset();
    document.getElementById('attendanceDate').valueAsDate = new Date();
    document.getElementById('overtimeHours').value = 0;
    document.getElementById('advance').value = 0;
    document.getElementById('smokingCost').value = 0;
    
    isEditing = false;
    currentAttendanceId = null;
    
    renderAttendanceTable();
}

// عرض اليوميات في الجدول
function renderAttendanceTable() {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendanceTableBody.innerHTML = '';
    
    // ترتيب اليوميات حسب التاريخ (الأحدث أولاً)
    const sortedAttendance = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedAttendance.forEach(att => {
        const row = document.createElement('tr');
        
        // عمود التاريخ
        const dateCell = document.createElement('td');
        const formattedDate = new Date(att.date).toLocaleDateString('ar-EG');
        dateCell.textContent = formattedDate;
        
        // عمود اسم العامل
        const nameCell = document.createElement('td');
        nameCell.textContent = att.workerName;
        
        // عمود الورشة
        const workshopCell = document.createElement('td');
        workshopCell.textContent = att.workshop || '-';
        
        // عمود الحضور
        const statusCell = document.createElement('td');
        const statusText = {
            'present': 'حاضر',
            'absent': 'غائب',
            'late': 'متأخر',
            'excused': 'إجازة'
        };
        statusCell.textContent = statusText[att.attendanceStatus] || att.attendanceStatus;
        
        // عمود الساعات الإضافية
        const overtimeCell = document.createElement('td');
        overtimeCell.textContent = att.overtime || 0;
        
        // عمود السلف
        const advanceCell = document.createElement('td');
        advanceCell.textContent = att.advance ? `${att.advance} شيكل` : '-';
        
        // عمود التدخين
        const smokingCell = document.createElement('td');
        smokingCell.textContent = att.smoking ? `${att.smoking} شيكل` : '-';
        
        // عمود الإجراءات
        const actionsCell = document.createElement('td');
        
        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn small';
        editBtn.onclick = () => editAttendance(att.id);
        
        // زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn small danger';
        deleteBtn.onclick = () => deleteAttendance(att.id);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        
        // إضافة الخلايا إلى الصف
        row.appendChild(dateCell);
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        row.appendChild(overtimeCell);
        row.appendChild(advanceCell);
        row.appendChild(smokingCell);
        row.appendChild(actionsCell);
        
        attendanceTableBody.appendChild(row);
    });
}

// تعديل يومية
function editAttendance(id) {
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const att = attendance.find(a => a.id === id);
    
    if (att) {
        isEditing = true;
        currentAttendanceId = id;
        
        document.getElementById('attendanceDate').value = att.date;
        workerSelect.value = att.workerId;
        document.getElementById('attendanceStatus').value = att.attendanceStatus || 'present';
        document.getElementById('overtimeHours').value = att.overtime || 0;
        document.getElementById('advance').value = att.advance || 0;
        document.getElementById('smokingCost').value = att.smoking || 0;
        document.getElementById('attendanceNotes').value = att.notes || '';
        
        // التمرير إلى أعلى النموذج
        attendanceForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// حذف يومية
function deleteAttendance(id) {
    if (confirm('هل أنت متأكد من حذف هذه اليومية؟')) {
        let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
        attendance = attendance.filter(a => a.id !== id);
        localStorage.setItem('attendance', JSON.stringify(attendance));
        renderAttendanceTable();
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initAttendancePage();
});

// تصدير الدالة للاستخدام من app.js
window.initAttendancePage = initAttendancePage;