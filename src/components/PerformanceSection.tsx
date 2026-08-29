import React from 'react';
import { TrendingUp, Award, ArrowUpRight } from 'lucide-react';

export const PerformanceSection: React.FC = () => {
  const trendBars = [
    { label: 'هفته ۱', newH: '45%', preH: '30%', val: '۴۲۰ میلیون تومان' },
    { label: 'هفته ۲', newH: '70%', preH: '55%', val: '۶۸۰ میلیون تومان' },
    { label: 'هفته ۳', newH: '60%', preH: '40%', val: '۵۴۰ میلیون تومان' },
    { label: 'هفته ۴', newH: '85%', preH: '65%', val: '۸۹۰ میلیون تومان' },
    { label: 'هفته ۵', newH: '95%', preH: '50%', val: '۱.۱ میلیارد تومان' },
    { label: 'هفته ۶', newH: '75%', preH: '60%', val: '۷۲۰ میلیون تومان' },
    { label: 'هفته ۷', newH: '90%', preH: '70%', val: '۹۶۰ میلیون تومان' },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-48 flex-shrink-0">
      {/* Sales / Trade Trend Bar Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>روند حجم واردات و سرعت ترخیص کارگوها (۳۰ روز اخیر)</span>
            </h4>
            <p className="text-[10px] text-slate-400">حجم تجمیعی سفارش‌های گشایش‌یافته در مقایسه با کارگوهای تخلیه و ترخیص‌شده</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-600">واردات مستقیم جدید</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              <span className="text-slate-600">ترخیص‌شده انبار گمرک</span>
            </span>
          </div>
        </div>

        {/* High Density Bar visualization */}
        <div className="flex-1 flex items-end gap-3 pt-3 pb-1 min-h-[90px]">
          {trendBars.map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                <div
                  className="w-1/2 bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-600 relative cursor-pointer"
                  style={{ height: bar.newH }}
                  title={`واردات: ${bar.val}`}
                ></div>
                <div
                  className="w-1/2 bg-slate-200 rounded-t transition-all duration-300 group-hover:bg-slate-300 cursor-pointer"
                  style={{ height: bar.preH }}
                  title={`موجودی ترخیص`}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dealer Performance Index Dark Card */}
      <div className="bg-[#1E293B] rounded-2xl p-4 shadow-xs text-white flex flex-col justify-between border border-slate-700/60">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 mb-0.5 tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              شاخص سلامت بازرگانی و ترخیص گمرکی
            </h4>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-white font-mono">۹۴.۸</div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +۳.۲ امتیاز
              </span>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
            رتبه الف بازرگان
          </span>
        </div>

        <div className="space-y-2 mt-2">
          <div>
            <div className="flex justify-between items-center text-[10px] font-medium mb-1">
              <span className="text-slate-300">نرخ قبولی اسناد در اظهار گمرکی (EPL)</span>
              <span className="text-emerald-400 font-bold font-mono">۹۸٪</span>
            </div>
            <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[10px] font-medium mb-1">
              <span className="text-slate-300">سرعت تأمین و تخصیص ارز صمت / نیما</span>
              <span className="text-blue-400 font-bold font-mono">۸۶.۴٪</span>
            </div>
            <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '86.4%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

