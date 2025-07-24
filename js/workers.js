// تهيئة بيانات العمال إذا لم تكن موجودة
if (!localStorage.getItem('workers')) {
    localStorage.setItem('workers', JSON.stringify([]));
}

// تهيئة بيانات الورش إذا لم تكن موجودة
if (!localStorage.getItem('workshops')) {
    const defaultWorkshops = [
        { id: 1, name: 'ورشة البناء' },
        { id: 2, name: 'ورشة الكهرباء' },
        { id: 3, name: 'ورشة السباكة' }
    ];
    localStorage.setItem('workshops', JSON.stringify(defaultWorkshops));
}

// عناصر DOM
let workersTableBody;
let workerForm;
let cancelWorkerEditBtn;

// متغيرات حالة
let currentWorkerId = null;
let isEditing = false;
let currentContractorId = null;

// تهيئة عناصر DOM عند تحميل الصفحة
function initWorkersPage() {
    workersTableBody = document.getElementById('workersTableBody');
    workerForm = document.getElementById('workerForm');
    cancelWorkerEditBtn = document.getElementById('cancelWorkerEdit');

    if (workerForm) {
        workerForm.addEventListener('submit', handleWorkerSubmit);
    }

    if (cancelWorkerEditBtn) {
        cancelWorkerEditBtn.addEventListener('click', cancelWorkerEdit);
    }

    populateContractorsDropdown();
    populateWorkshopsDropdown();
    renderWorkersTable();
}

// إلغاء التعديل
function cancelWorkerEdit() {
    isEditing = false;
    currentWorkerId = null;
    workerForm.reset();
    cancelWorkerEditBtn.style.display = 'none';
    document.querySelector('.worker-form-section h2').textContent = 'إضافة عامل جديد';

    // إعادة تفعيل قائمة المقاولين
    const contractorSelect = document.getElementById('workerContractor');
    if (contractorSelect) {
        contractorSelect.disabled = false;
    }
}



// تعبئة قائمة المقاولين في النموذج
function populateContractorsDropdown() {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractorSelect = document.getElementById('workerContractor');
    
    // مسح الخيارات الحالية
    contractorSelect.innerHTML = '<option value="">اختر مقاولاً</option>';
    
    // إضافة المقاولين
    contractors.forEach(contractor => {
        const option = document.createElement('option');
        option.value = contractor.id;
        option.textContent = contractor.name;
        contractorSelect.appendChild(option);
    });
}

// تعبئة قائمة الورش في النموذج
function populateWorkshopsDropdown() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshopSelect = document.getElementById('workerWorkshop');
    
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

// تحويل الصورة إلى base64
function convertImageToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// معالجة حفظ العامل
function handleWorkerSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('workerName').value.trim();
    const contractorId = document.getElementById('workerContractor').value;
    const workshopId = document.getElementById('workerWorkshop').value;
    const number = document.getElementById('workerNumber').value.trim();
    const dailyWage = parseFloat(document.getElementById('dailyWage').value);
    const overtimeRate = parseFloat(document.getElementById('overtimeRate').value);
    const imageFile = document.getElementById('workerImage').files[0];
    const isActive = document.getElementById('workerActive').checked;

    if (!name || !contractorId || !number || isNaN(dailyWage) || isNaN(overtimeRate)) {
        alert('الرجاء ملء جميع الحقول المطلوبة');
        return;
    }

    // الحصول على بيانات المقاول
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractor = contractors.find(c => c.id == contractorId);

    if (!contractor) {
        alert('المقاول المحدد غير موجود');
        return;
    }

    // الحصول على بيانات الورشة
    let workshop = null;
    if (workshopId) {
        const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
        workshop = workshops.find(w => w.id == workshopId);
    }

    const workerData = {
        name,
        contractorId: parseInt(contractorId),
        contractorName: contractor.name,
        workshopId: workshop ? parseInt(workshopId) : null,
        workshopName: workshop ? workshop.name : '',
        number,
        dailyWage,
        overtimeRate,
        active: isActive
    };

    // معالجة الصورة
    if (imageFile) {
        convertImageToBase64(imageFile, function(base64Image) {
            workerData.image = base64Image;
            saveWorker(workerData);
        });
    } else {
        // الاحتفاظ بالصورة القديمة في حالة التعديل
        if (isEditing && currentWorkerId) {
            const workers = JSON.parse(localStorage.getItem('workers')) || [];
            const existingWorker = workers.find(w => w.id === currentWorkerId);
            if (existingWorker && existingWorker.image) {
                workerData.image = existingWorker.image;
            }
        }
        saveWorker(workerData);
    }
}



// حفظ العامل في localStorage
function saveWorker(workerData) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    
    if (isEditing && currentWorkerId !== null) {
        // تحديث عامل موجود
        const index = workers.findIndex(w => w.id === currentWorkerId);
        if (index !== -1) {
            workers[index] = { ...workers[index], ...workerData };
        }
    } else {
        // إضافة عامل جديد
        const newId = workers.length > 0 ? Math.max(...workers.map(w => w.id)) + 1 : 1;
        workerData.id = newId;
        workers.push(workerData);
        
        // إضافة العامل إلى قائمة عمال المقاول
        updateContractorWorkers(workerData.contractorId, newId, true);
    }
    
    localStorage.setItem('workers', JSON.stringify(workers));

    // إعادة تعيين النموذج
    workerForm.reset();
    cancelWorkerEdit();
    renderWorkersTable();
}

// تحديث قائمة عمال المقاول
function updateContractorWorkers(contractorId, workerId, add = true) {
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const contractorIndex = contractors.findIndex(c => c.id == contractorId);
    
    if (contractorIndex !== -1) {
        if (!contractors[contractorIndex].workers) {
            contractors[contractorIndex].workers = [];
        }
        
        if (add) {
            // إضافة العامل إلى المقاول
            if (!contractors[contractorIndex].workers.includes(workerId)) {
                contractors[contractorIndex].workers.push(workerId);
            }
        } else {
            // إزالة العامل من المقاول
            contractors[contractorIndex].workers = contractors[contractorIndex].workers.filter(id => id !== workerId);
        }
        
        localStorage.setItem('contractors', JSON.stringify(contractors));
    }
}

// عرض العمال في الجدول
function renderWorkersTable() {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    workersTableBody.innerHTML = '';
    
    // تصفية العمال حسب المقاول الحالي إذا كان محدداً
    let filteredWorkers = workers;
    if (currentContractorId) {
        filteredWorkers = workers.filter(worker => worker.contractorId == currentContractorId);
    }
    
    filteredWorkers.forEach(worker => {
        const row = document.createElement('tr');
        
        // عمود الصورة
        const imgCell = document.createElement('td');
        if (worker.image) {
            const img = document.createElement('img');
            img.src = worker.image;
            img.alt = worker.name;
            img.width = 50;
            img.height = 50;
            img.style.borderRadius = '50%';
            imgCell.appendChild(img);
        } else {
            imgCell.textContent = 'بدون صورة';
        }
        
        // عمود الاسم
        const nameCell = document.createElement('td');
        nameCell.textContent = worker.name;
        
        // عمود المقاول
        const contractorCell = document.createElement('td');
        contractorCell.textContent = worker.contractorName || '-';
        
        // عمود الورشة
        const workshopCell = document.createElement('td');
        workshopCell.textContent = worker.workshop || '-';
        
        // عمود رقم التشغيل
        const numberCell = document.createElement('td');
        numberCell.textContent = worker.number;
        
        // عمود اليومية
        const wageCell = document.createElement('td');
        wageCell.textContent = `${worker.dailyWage} شيكل`;
        
        // عمود الساعة الإضافية
        const overtimeCell = document.createElement('td');
        overtimeCell.textContent = `${worker.overtimeRate} شيكل`;
        
        // عمود الحالة
        const statusCell = document.createElement('td');
        statusCell.textContent = worker.active ? 'نشط' : 'مؤرشف';
        statusCell.style.color = worker.active ? 'green' : 'orange';
        
        // عمود الإجراءات
        const actionsCell = document.createElement('td');
        
        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn small';
        editBtn.onclick = () => editWorker(worker.id);
        
        // زر الأرشفة/الاستعادة
        const archiveBtn = document.createElement('button');
        archiveBtn.textContent = worker.active ? 'أرشفة' : 'استعادة';
        archiveBtn.className = worker.active ? 'btn small warning' : 'btn small success';
        archiveBtn.onclick = () => toggleArchiveWorker(worker.id, !worker.active);
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(archiveBtn);
        
        // إضافة الخلايا إلى الصف
        row.appendChild(imgCell);
        row.appendChild(nameCell);
        row.appendChild(contractorCell);
        row.appendChild(workshopCell);
        row.appendChild(numberCell);
        row.appendChild(wageCell);
        row.appendChild(overtimeCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);
        
        workersTableBody.appendChild(row);
    });
}

// تعديل عامل
function editWorker(id) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const worker = workers.find(w => w.id === id);

    if (worker) {
        isEditing = true;
        currentWorkerId = id;

        document.getElementById('workerName').value = worker.name;
        document.getElementById('workerContractor').value = worker.contractorId || '';
        document.getElementById('workerWorkshop').value = worker.workshopId || '';
        document.getElementById('workerNumber').value = worker.number;
        document.getElementById('dailyWage').value = worker.dailyWage;
        document.getElementById('overtimeRate').value = worker.overtimeRate;
        document.getElementById('workerActive').checked = worker.active;

        // تغيير عنوان النموذج
        document.querySelector('.worker-form-section h2').textContent = 'تعديل بيانات العامل';
        cancelWorkerEditBtn.style.display = 'inline-block';
    }
}

// أرشفة/استعادة عامل
function toggleArchiveWorker(id, active) {
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerIndex = workers.findIndex(w => w.id === id);
    
    if (workerIndex !== -1) {
        workers[workerIndex].active = active;
        localStorage.setItem('workers', JSON.stringify(workers));
        renderWorkersTable();
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من وجود معرف مقاول محدد
    const storedContractorId = localStorage.getItem('currentContractorId');
    if (storedContractorId) {
        currentContractorId = parseInt(storedContractorId);
        
        // إضافة زر العودة إلى صفحة المقاولين
        const header = document.querySelector('header');
        const backBtn = document.createElement('a');
        backBtn.href = 'contractors.html';
        backBtn.className = 'btn';
        backBtn.textContent = 'العودة لقائمة المقاولين';
        header.querySelector('nav').prepend(backBtn);
        
        // تغيير عنوان الصفحة
        const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
        const contractor = contractors.find(c => c.id == currentContractorId);
        if (contractor) {
            document.querySelector('header h1').textContent = `إدارة عمال المقاول: ${contractor.name}`;
        }
    }
    
    initWorkersPage();
});

// تصدير الدالة للاستخدام من app.js
window.initWorkersPage = initWorkersPage;