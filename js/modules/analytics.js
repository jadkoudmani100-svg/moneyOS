/**
 * Money OS - وحدة التحليلات ورسم الدائرة البيانية دون مكتبات خارجية
 */
const Analytics = (() => {
  const CATEGORY_COLORS = {
    'راتب': '#10b981',
    'تجارة': '#3b82f6',
    'طعام': '#f59e0b',
    'سكن': '#8b5cf6',
    'مواصلات': '#06b6d4',
    'صحة': '#ec4899',
    'ترفيه': '#f97316',
    'أخرى': '#64748b'
  };

  function drawChart(transactions = []) {
    const canvas = document.getElementById('expenseChart');
    const legendBox = document.getElementById('chartLegendBox');
    if (!canvas || !legendBox) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // تجميع المصروفات فقط حسب التصنيف
    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length === 0) {
      // رسم حلقة فارغة أنيقة
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 18;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد مصروفات بعد', width / 2, height / 2 + 5);

      legendBox.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); font-size: 0.8rem;">
          سجل عملياتك وستظهر التحليلات تلقائياً هنا
        </div>
      `;
      return;
    }

    const catTotals = {};
    let grandTotal = 0;

    expenses.forEach(t => {
      const cat = t.category || 'أخرى';
      const val = Rates.convertToUSD(t.amount, t.currency);
      catTotals[cat] = (catTotals[cat] || 0) + val;
      grandTotal += val;
    });

    let startAngle = -Math.PI / 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 70;

    let legendHtml = '';

    Object.keys(catTotals).forEach(cat => {
      const amount = catTotals[cat];
      const sliceAngle = (amount / grandTotal) * (Math.PI * 2);
      const color = CATEGORY_COLORS[cat] || '#64748b';
      const pct = ((amount / grandTotal) * 100).toFixed(1);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 20;
      ctx.stroke();

      startAngle += sliceAngle;

      legendHtml += `
        <div class="legend-item">
          <div>
            <span class="legend-color-dot" style="background-color: ${color};"></span>
            <span>${cat}</span>
          </div>
          <div>
            <strong style="color: var(--text-main);">$${amount.toFixed(2)}</strong>
            <span style="color: var(--text-dim); margin-right: 6px;">(${pct}%)</span>
          </div>
        </div>
      `;
    });

    legendBox.innerHTML = legendHtml;
  }

  return {
    drawChart
  };
})();
