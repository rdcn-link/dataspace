from __future__ import annotations
import numpy as np
from scipy.integrate import cumulative_trapezoid
from scipy.optimize import least_squares
from common import table,number,positive,increasing,window,linear,result,interval


def band_edges(args):
    d=table(args,['k_index','band_index','energy_eV','occupation'],2)
    full=number(args,'full_occupation',positive=True);tol=number(args,'occupation_tolerance',1e-6,True)
    if tol>=full/2:raise ValueError('占据容差须小于满占据的一半')
    k,b,e,o=[d[n] for n in ['k_index','band_index','energy_eV','occupation']]
    if (k<0).any() or (b<0).any() or (k%1).any() or (b%1).any() or np.unique(np.c_[k,b],axis=0).shape[0]!=len(k):raise ValueError('k_index/band_index 须为唯一非负整数对；请先分离自旋通道')
    if (o < -tol).any() or (o>full+tol).any():raise ValueError('占据数超出所声明范围')
    occupied=o>=full-tol;empty=o<=tol;partial=~(occupied|empty)
    if not occupied.any() or not empty.any():raise ValueError('需要同时包含价带与导带采样')
    vbm=float(e[occupied].max());cbm=float(e[empty].min());gap=max(0,cbm-vbm)
    direct=[]
    for ki in np.unique(k):
        val=(k==ki)&occupied;con=(k==ki)&empty
        if val.any() and con.any():direct.append(float(e[con].min()-e[val].max()))
    metallic=bool(partial.any() or gap<=0)
    summary={'sampled_VBM_eV':vbm,'sampled_CBM_eV':cbm,'sampled_gap_eV':0 if metallic else gap,'sampled_min_direct_gap_eV':max(0,min(direct)) if direct else None,'partially_occupied_states':int(partial.sum()),'metallic_or_smeared':metallic}
    return result(summary,d,x=k,ys={'energy':e},xlabel='Sampled k index',ylabel='Energy (eV)',kind='scatter',notes=['仅给定 k 点/自旋数据的带边；部分占据可能来自金属或有限温度展宽，不作唯一材料分类。'])


def dos_integral(args):
    d=table(args,['energy_eV','dos_states_eV_cell'],3);e=d['energy_eV'];dos=d['dos_states_eV_cell'];increasing(e)
    if (dos<0).any():raise ValueError('DOS 不能为负')
    xx,yy=interval(e,dos,number(args,'energy_min_eV'),number(args,'energy_max_eV'));integral=cumulative_trapezoid(yy,xx,initial=0)
    return result({'integrated_states_per_cell':integral[-1]},{'energy_eV':xx,'dos_states_eV_cell':yy,'cumulative_states_per_cell':integral},x=xx,ys={'DOS':yy},xlabel='Energy (eV)',ylabel='DOS (states/eV/cell)',notes=['直接积分输入态密度，不乘费米分布；自旋计数约定沿用输入。'])


def tauc(args):
    d=table(args,['photon_energy_eV','absorption_cm_1'],3);e=d['photon_energy_eV'];alpha=d['absorption_cm_1'];positive(e,alpha);increasing(e)
    power=number(args,'tauc_power')
    if power not in (.5,2):raise ValueError('tauc_power 仅支持 2（直接允许）或0.5（间接允许）')
    mask=window(e,args);x=e[mask];y=(alpha[mask]*x)**power;fit,pred=linear(x,y)
    gap=-fit['intercept']/fit['slope'] if fit['slope'] else np.nan
    if fit['slope']<=0 or not 0<gap<=x[-1]:raise ValueError('指定 Tauc 区间不能给出物理合理的正带隙截距')
    return result({'tauc_gap_eV':gap,'tauc_power':power,**fit},{'energy_eV':x,'tauc_ordinate':y,'fit':pred},x=x,ys={'transformed absorption':y,'fit':pred},xlabel='Photon energy (eV)',ylabel=f'(alpha E)^{power}',notes=['用户明确指定跃迁假设和线性区间；不可把吸光度直接当作吸收系数。'])


def four_probe(args):
    d=table(args,['current_A','voltage_V'],3);fit,pred=linear(d['current_A'],d['voltage_V'])
    correction=number(args,'geometry_correction',1,True);thickness=number(args,'thickness_m',positive=True)
    if fit['slope']<=0:raise ValueError('电压电流拟合电阻必须为正')
    sheet=np.pi/np.log(2)*fit['slope']*correction
    return result({'sheet_resistance_ohm_sq':sheet,'resistivity_ohm_m':sheet*thickness,'voltage_offset_V':fit['intercept'],**fit},{**d,'fit_voltage_V':pred},x=d['current_A'],ys={'voltage':d['voltage_V'],'fit':pred},xlabel='Current (A)',ylabel='Voltage (V)',notes=['等间距共线四探针、薄片模型；有限尺寸与厚度修正由 geometry_correction 显式提供。'])


def capacity(args):
    d=table(args,['time_s','current_A'],2);t=d['time_s'];i=d['current_A'];increasing(t)
    mass=number(args,'active_mass_g',positive=True)
    if (i>0).any() and (i<0).any():raise ValueError('请先分离单个充电或放电段，不能跨极性积分')
    charge=cumulative_trapezoid(i,t,initial=0)/3.6
    return result({'signed_capacity_mAh':charge[-1],'specific_capacity_mAh_g':abs(charge[-1])/mass,'duration_s':t[-1]-t[0]},{'time_s':t,'current_A':i,'signed_capacity_mAh':charge},x=t,ys={'capacity':charge},xlabel='Time (s)',ylabel='Signed capacity (mAh)',notes=['单段实测电流时间积分，不自动推断循环、库仑效率或电极活性质量。'])


def impedance(args):
    d=table(args,['frequency_Hz','real_ohm','imag_ohm'],5);f=d['frequency_Hz'];re=d['real_ohm'];im=d['imag_ohm'];positive(f)
    if len(np.unique(f))<5 or (re<0).any():raise ValueError('至少五个不同正频率且实部非负')
    # Im(Z) must be supplied with its signed capacitive (negative) convention.
    if (im>1e-10).any() or not (im<0).any():raise ValueError('需要带符号的电容性 Im(Z)≤0；不能把 -Im(Z) 当作 Im(Z) 输入')
    scale=max(float(np.max(abs(re+1j*im))),1e-12)
    rs=max(float(re.min()),scale*1e-6);rct=max(float(np.ptp(re)),scale*.1);c=1/(2*np.pi*f[np.argmin(im)]*rct)
    def model(p):
        r0,r1,cap=np.exp(p);return r0+r1/(1+2j*np.pi*f*r1*cap)
    def residual(p):
        z=model(p)-(re+1j*im);return np.r_[z.real,z.imag]/scale
    fit=least_squares(residual,np.clip(np.log([rs,rct,c]),-49,49),bounds=(-50,50),max_nfev=3000)
    if not fit.success or np.linalg.matrix_rank(fit.jac)<3 or np.linalg.cond(fit.jac)>1e8:raise ValueError('Rs+(Rct||C) 拟合失败或参数不可辨识；需覆盖更多频率')
    rs,rct,c=np.exp(fit.x);pred=model(fit.x)
    out=result({'series_resistance_ohm':rs,'charge_transfer_resistance_ohm':rct,'capacitance_F':c,'time_constant_s':rct*c,'complex_rmse_ohm':float(np.sqrt(np.mean(abs(pred-re-1j*im)**2)))},{**d,'fit_real_ohm':pred.real,'fit_imag_ohm':pred.imag},x=re,ys={'observed -Im':-im},xlabel='Re(Z) (ohm)',ylabel='-Im(Z) (ohm)',kind='scatter',notes=['固定理想电路 Rs+(Rct||C)，不自动加入 CPE、扩散或电感；不证明唯一电化学机制。'])
    out['plot']['extra_xy']=[(pred.real,-pred.imag,'circuit fit')]
    out['plot']['equal_aspect']=True
    return out
