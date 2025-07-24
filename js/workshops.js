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
let workshopsTableBody;
let workshopForm;
let cancelWorkshopEditBtn;

// متغيرات حالة
let currentWorkshopId = null;
let isEditing = false;

// تهيئة عناصر DOM عند تحميل الصفحة
function initWorkshopsPage() {
    workshopsTableBody = document.getElementById('workshopsTableBody');
    workshopForm = document.getElementById('workshopForm');
    cancelWorkshopEditBtn = document.getElementById('cancelWorkshopEdit');

    if (workshopForm) {
        workshopForm.addEventListener('submit', handleWorkshopSubmit);
    }

    if (cancelWorkshopEditBtn) {
        cancelWorkshopEditBtn.addEventListener('click', cancelWorkshopEdit);
    }

    renderWorkshopsTable();
}

// إلغاء التعديل
function cancelWorkshopEdit() {
    isEditing = false;
    currentWorkshopId = null;
    workshopForm.reset();
    cancelWorkshopEditBtn.style.display = 'none';
    document.querySelector('.workshop-form-section h2').textContent = 'إضافة ورشة جديدة';
}

// معالجة حفظ الورشة
function handleWorkshopSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('workshopName').value.trim();
    const location = document.getElementById('workshopLocation').value.trim();
    const manager = document.getElementById('workshopManager').value.trim();
    const phone = document.getElementById('workshopPhone').value.trim();
    const notes = document.getElementById('workshopNotes').value.trim();

    if (!name) {
        alert('الرجاء إدخال اسم الورشة');
        return;
    }

    saveWorkshop({ name, location, manager, phone, notes });
}

// حفظ الورشة في localStorage
function saveWorkshop(workshopData) {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];

    if (isEditing && currentWorkshopId !== null) {
        // تحديث ورشة موجودة
        const index = workshops.findIndex(w => w.id === currentWorkshopId);
        if (index !== -1) {
            workshops[index] = { ...workshops[index], ...workshopData };
        }
    } else {
        // إضافة ورشة جديدة
        const newId = workshops.length > 0 ? Math.max(...workshops.map(w => w.id)) + 1 : 1;
        workshopData.id = newId;
        workshops.push(workshopData);
    }

    localStorage.setItem('workshops', JSON.stringify(workshops));

    // إعادة تعيين النموذج
    workshopForm.reset();
    cancelWorkshopEdit();
    renderWorkshopsTable();
}

// عرض الورش في الجدول
function renderWorkshopsTable() {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    workshopsTableBody.innerHTML = '';
    
    // حساب عدد العمال لكل ورشة
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workerCounts = {};
    workers.forEach(worker => {
        if (worker.active && worker.workshopId) {
            workerCounts[worker.workshopId] = (workerCounts[worker.workshopId] || 0) + 1;
        }
    });
    
    // حساب التكاليف لكل ورشة
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const costs = {};
    foremen.forEach(foreman => {
        if (foreman.workshopId) {
            costs[foreman.workshopId] = (costs[foreman.workshopId] || 0) + foreman.costs;
        }
    });
    
    workshops.forEach(workshop => {
        const row = document.createElement('tr');

        // عمود اسم الورشة
        const nameCell = document.createElement('td');
        nameCell.textContent = workshop.name;

        // عمود الموقع
        const locationCell = document.createElement('td');
        locationCell.textContent = workshop.location || '-';

        // عمود المسؤول
        const managerCell = document.createElement('td');
        managerCell.textContent = workshop.manager || '-';

        // عمود رقم الهاتف
        const phoneCell = document.createElement('td');
        phoneCell.textContent = workshop.phone || '-';

        // عمود عدد العمال
        const workersCell = document.createElement('td');
        workersCell.textContent = workerCounts[workshop.id] || 0;

        // عمود الإجراءات
        const actionsCell = document.createElement('td');

        // زر التعديل
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn small';
        editBtn.onclick = () => editWorkshop(workshop.id);

        // زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn small danger';
        deleteBtn.onclick = () => deleteWorkshop(workshop.id);

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        // إضافة الخلايا إلى الصف
        row.appendChild(nameCell);
        row.appendChild(locationCell);
        row.appendChild(managerCell);
        row.appendChild(phoneCell);
        row.appendChild(workersCell);
        row.appendChild(actionsCell);

        workshopsTableBody.appendChild(row);
    });
}

// تعديل ورشة
function editWorkshop(id) {
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const workshop = workshops.find(w => w.id === id);

    if (workshop) {
        isEditing = true;
        currentWorkshopId = id;

        document.getElementById('workshopName').value = workshop.name;
        document.getElementById('workshopLocation').value = workshop.location || '';
        document.getElementById('workshopManager').value = workshop.manager || '';
        document.getElementById('workshopPhone').value = workshop.phone || '';
        document.getElementById('workshopNotes').value = workshop.notes || '';

        // تغيير عنوان النموذج
        document.querySelector('.workshop-form-section h2').textContent = 'تعديل بيانات الورشة';
        cancelWorkshopEditBtn.style.display = 'inline-block';
    }
}

// حذف ورشة
function deleteWorkshop(id) {
    if (confirm('هل أنت متأكد من حذف هذه الورشة؟ سيتم إزالة جميع العمال والمُعلمين المرتبطين بها.')) {
        // حذف الورشة
        let workshops = JSON.parse(localStorage.getItem('workshops')) || [];
        workshops = workshops.filter(w => w.id !== id);
        localStorage.setItem('workshops', JSON.stringify(workshops));
        
        // إزالة الورشة من العمال
        let workers = JSON.parse(localStorage.getItem('workers')) || [];
        workers = workers.map(worker => {
            if (worker.workshopId === id) {
                return { ...worker, workshopId: null, workshop: '' };
            }
            return worker;
        });
        localStorage.setItem('workers', JSON.stringify(workers));
        
        // إزالة الورشة من المُعلمين
        let foremen = JSON.parse(localStorage.getItem('foremen')) || [];
        foremen = foremen.map(foreman => {
            if (foreman.workshopId === id) {
                return { ...foreman, workshopId: null, workshop: '' };
            }
            return foreman;
        });
        localStorage.setItem('foremen', JSON.stringify(foremen));
        
        renderWorkshopsTable();
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initWorkshopsPage();
});

// تصدير الدالة للاستخدام من app.js
window.initWorkshopsPage = initWorkshopsPage;