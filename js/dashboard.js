// تحديث لوحة التحكم باستخدام البيانات الفعلية من localStorage
function calculateStatistics() {
    // الحصول على البيانات من localStorage
    const workers = JSON.parse(localStorage.getItem('workers')) || [];
    const workshops = JSON.parse(localStorage.getItem('workshops')) || [];
    const foremen = JSON.parse(localStorage.getItem('foremen')) || [];
    const contractors = JSON.parse(localStorage.getItem('contractors')) || [];
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // عدد العمال النشطين
    const activeWorkers = workers.filter(worker => worker.active);
    
    // عدد الورش
    const workshopsCount = workshops.length;
    
    // عدد المقاولين
    const contractorsCount = contractors.length;
    
    // عدد المُعلمين
    const foremenCount = foremen.length;
    
    // حساب مجموع الرواتب
    let totalSalaries = 0;
    if (attendance.length > 0) {
        activeWorkers.forEach(worker => {
            const workerAttendance = attendance.filter(a => a.workerId === worker.id);
            workerAttendance.forEach(att => {
                // يوم كامل أو نصف يوم
                const dayRate = att.fullDay ? worker.dailyWage : worker.dailyWage / 2;
                totalSalaries += dayRate;
                
                // الساعات الإضافية
                if (att.overtime) {
                    totalSalaries += att.overtime * worker.overtimeRate;
                }
                
                // خصم السلف والتدخين
                if (att.advance) totalSalaries -= att.advance;
                if (att.smoking) totalSalaries -= att.smoking;
            });
        });
    }
    
    // مجموع تكاليف المُعلمين
    const foremanCostsData = JSON.parse(localStorage.getItem('foremanCosts')) || [];
    const foremenCosts = foremanCostsData.reduce((sum, cost) => sum + cost.amount, 0);
    
    // عدد أيام عمل العمال
    const workDays = attendance.length;
    
    // عدد الساعات الإضافية
    const overtimeHours = attendance.reduce((sum, att) => sum + (att.overtime || 0), 0);
    
    // أكثر عامل عملًا (بعدد الأيام)
    let topWorker = '-';
    let topOvertime = '-';
    
    if (attendance.length > 0) {
        const workerDays = {};
        attendance.forEach(att => {
            workerDays[att.workerId] = (workerDays[att.workerId] || 0) + 1;
        });
        
        if (Object.keys(workerDays).length > 0) {
            const topWorkerId = Object.keys(workerDays).reduce((a, b) => 
                workerDays[a] > workerDays[b] ? a : b, Object.keys(workerDays)[0]);
            const topWorkerObj = workers.find(w => w.id == topWorkerId);
            if (topWorkerObj) topWorker = topWorkerObj.name;
        }
        
        // أكثر عامل عمل ساعات إضافية
        const workerOvertime = {};
        attendance.forEach(att => {
            if (att.overtime) {
                workerOvertime[att.workerId] = (workerOvertime[att.workerId] || 0) + att.overtime;
            }
        });
        
        if (Object.keys(workerOvertime).length > 0) {
            const topOvertimeId = Object.keys(workerOvertime).reduce((a, b) => 
                workerOvertime[a] > workerOvertime[b] ? a : b, Object.keys(workerOvertime)[0]);
            const topOvertimeObj = workers.find(w => w.id == topOvertimeId);
            if (topOvertimeObj) topOvertime = topOvertimeObj.name;
        }
    }
    
    return {
        workersCount: activeWorkers.length,
        workshopsCount,
        contractorsCount,
        foremenCount,
        totalSalaries,
        foremenCosts,
        workDays,
        overtimeHours,
        topWorker,
        topOvertime
    };
}

// تحديث واجهة لوحة التحكم بالإحصائيات
function updateDashboard() {
    const stats = calculateStatistics();
    
    document.getElementById('workersCount').textContent = stats.workersCount;
    document.getElementById('workshopsCount').textContent = stats.workshopsCount;
    document.getElementById('contractorsCount').textContent = stats.contractorsCount;
    document.getElementById('foremenCount').textContent = stats.foremenCount;
    document.getElementById('totalSalaries').textContent = `${stats.totalSalaries} شيكل`;
    document.getElementById('foremenCosts').textContent = `${stats.foremenCosts} شيكل`;
    document.getElementById('workDays').textContent = stats.workDays;
    document.getElementById('overtimeHours').textContent = stats.overtimeHours;
    document.getElementById('topWorker').textContent = stats.topWorker;
    document.getElementById('topOvertime').textContent = stats.topOvertime;
}

// تهيئة بيانات تجريبية إذا لم تكن موجودة
function initializeDefaultData() {
    // تهيئة بيانات الورش إذا لم تكن موجودة
    if (!localStorage.getItem('workshops')) {
        const defaultWorkshops = [
            { id: 1, name: 'ورشة البناء' },
            { id: 2, name: 'ورشة الكهرباء' },
            { id: 3, name: 'ورشة السباكة' }
        ];
        localStorage.setItem('workshops', JSON.stringify(defaultWorkshops));
    }
    
    // تهيئة بيانات المقاولين إذا لم تكن موجودة
    if (!localStorage.getItem('contractors')) {
        const defaultContractors = [
            { id: 1, name: 'أبو محمد', phone: '0599123456', workers: [] }
        ];
        localStorage.setItem('contractors', JSON.stringify(defaultContractors));
    }
    
    // تهيئة بيانات العمال إذا لم تكن موجودة
    if (!localStorage.getItem('workers')) {
        localStorage.setItem('workers', JSON.stringify([]));
    }
    
    // تهيئة بيانات المعلمين إذا لم تكن موجودة
    if (!localStorage.getItem('foremen')) {
        localStorage.setItem('foremen', JSON.stringify([]));
    }
    
    // تهيئة بيانات الحضور إذا لم تكن موجودة
    if (!localStorage.getItem('attendance')) {
        localStorage.setItem('attendance', JSON.stringify([]));
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    initDashboardPage();
});

// وظيفة تهيئة صفحة لوحة التحكم - يمكن استدعاؤها من app.js
function initDashboardPage() {
    initializeDefaultData();
    updateDashboard();
    
    // تحديث لوحة التحكم كل 30 ثانية
    if (!window.dashboardInterval) {
        window.dashboardInterval = setInterval(updateDashboard, 30000);
    }
}