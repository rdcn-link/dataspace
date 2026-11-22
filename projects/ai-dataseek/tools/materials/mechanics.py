from __future__ import annotations
import json
import numpy as np
from scipy.integrate import cumulative_trapezoid
from common import table,number,positive,increasing,window,linear,result,source


def stress_strain(args):
    data=table(args,['strain','stress_MPa'],3);x=data['strain'];y=data['stress_MPa']
    increasing(x)
    if (x<0).any() or (y<0).any():raise ValueError('本工具针对单调拉伸加载，要求非负工程应变和应力')
    return x,y


def elastic(args):
    x,y=stress_strain(args);mask=window(x,args);fit,pred=linear(x[mask],y[mask])
    if fit['slope']<=0:raise ValueError('弹性拟合斜率必须为正')
    return result({'young_modulus_GPa':fit['slope']/1000,**fit},{'strain':x[mask],'stress_MPa':y[mask],'fit_MPa':pred},x=x[mask],ys={'stress':y[mask],'fit':pred},xlabel='Engineering strain',ylabel='Stress (MPa)',notes=['用户指定弹性区间的线性拟合；未自动修正机器柔度或零点。'])


def offset_yield(args):
    x,y=stress_strain(args);mask=window(x,args);fit,_=linear(x[mask],y[mask]);offset=number(args,'offset_strain',.002,True)
    if fit['slope']<=0:raise ValueError('弹性斜率必须为正')
    line=fit['slope']*(x-offset)+fit['intercept'];difference=y-line
    crossing=np.flatnonzero((x[:-1]>=number(args,'fit_max'))&(difference[:-1]>=0)&(difference[1:]<=0))
    if not len(crossing):raise ValueError('实测范围内未找到偏移线交点；不外推屈服强度')
    i=int(crossing[0]);f=difference[i]/(difference[i]-difference[i+1]) if difference[i]!=difference[i+1] else 0
    xx=x[i]+f*(x[i+1]-x[i]);yy=y[i]+f*(y[i+1]-y[i])
    return result({'proof_stress_MPa':yy,'proof_strain':xx,'offset_strain':offset,'young_modulus_GPa':fit['slope']/1000,'elastic_fit':fit},{'strain':x,'stress_MPa':y,'offset_line_MPa':line},x=x,ys={'stress':y,'offset line':line},xlabel='Engineering strain',ylabel='Stress (MPa)')


def true_curve(args):
    x,y=stress_strain(args)
    limit=number(args,'uniform_strain_max')
    if not x[0]<limit<=x[-1]:raise ValueError('必须明确位于数据范围内的均匀变形上限')
    mask=x<=limit;x=x[mask];y=y[mask]
    if len(x)<2:raise ValueError('均匀变形范围内至少需要两点')
    tx=np.log1p(x);ty=y*(1+x)
    return result({'point_count':len(x),'uniform_strain_max':limit},{'engineering_strain':x,'engineering_stress_MPa':y,'true_strain':tx,'true_stress_MPa':ty},x=tx,ys={'true stress':ty},xlabel='True strain',ylabel='True stress (MPa)',notes=['均匀单轴拉伸且体积近似不变；颈缩后不可使用此换算。'])


def strain_energy(args):
    x,y=stress_strain(args);energy=cumulative_trapezoid(y,x,initial=0)
    return result({'observed_work_density_MJ_m3':energy[-1],'ultimate_observed_stress_MPa':float(y.max()),'start_strain':x[0],'end_strain':x[-1]},{'strain':x,'stress_MPa':y,'cumulative_work_MJ_m3':energy},x=x,ys={'cumulative work':energy},xlabel='Engineering strain',ylabel='Work density (MJ/m3)',notes=['仅实测起止应变间的加载功；未确认断裂终点时不称为断裂韧性。'])


def creep(args):
    d=table(args,['time_s','strain'],3);x=d['time_s'];y=d['strain'];increasing(x)
    mask=window(x,args);fit,pred=linear(x[mask],y[mask])
    return result({'secondary_creep_rate_s_1':fit['slope'],**fit},{'time_s':x[mask],'strain':y[mask],'fitted_strain':pred},x=x[mask],ys={'strain':y[mask],'fit':pred},xlabel='Time (s)',ylabel='Strain',notes=['稳态阶段由用户选取，不自动判定三阶段蠕变。'])


def fatigue(args):
    d=table(args,['cycles_to_failure','stress_amplitude_MPa','failed'],3)
    positive(d['cycles_to_failure'],d['stress_amplitude_MPa'])
    if not (d['failed']==1).all():raise ValueError('Basquin 拟合仅接受已断裂试样；含 runout 的删失数据需专门生存模型')
    x=np.log10(d['cycles_to_failure']);y=np.log10(d['stress_amplitude_MPa']);fit,pred=linear(x,y)
    if fit['slope']>=0:raise ValueError('拟合不符合应力幅随寿命下降的 Basquin 模型')
    return result({'amplitude_coefficient_MPa':10**fit['intercept'],'exponent_b':fit['slope'],**fit},{'log10_cycles':x,'log10_stress':y,'fit':pred},x=x,ys={'observed':y,'fit':pred},xlabel='log10(cycles to failure)',ylabel='log10(stress amplitude / MPa)',notes=['sigma_a=A*N^b；不自动合并不同应力比、温度或表面状态。'])


def vickers(args):
    d=table(args,['force_N','diagonal1_mm','diagonal2_mm'],1);positive(*d.values())
    diagonal=(d['diagonal1_mm']+d['diagonal2_mm'])/2
    pressure=1.8544*d['force_N']/diagonal**2;hv=pressure/9.80665
    return result({'mean_HV':float(hv.mean()),'sample_std_HV':float(hv.std(ddof=1)) if len(hv)>1 else None},{**d,'hardness_HV':hv,'indentation_pressure_MPa':pressure},x=np.arange(1,len(hv)+1),ys={'HV':hv},xlabel='Indentation index',ylabel='Vickers hardness (HV)',notes=['HV 按 kgf/mm² 数值惯例报告；不进行经验性硬度标尺换算。'])


def elastic_tensor(args):
    raw=json.loads(source(args).read_text());c=np.asarray(raw['stiffness_GPa'],dtype=float)
    if c.shape!=(6,6) or not np.isfinite(c).all() or not np.allclose(c,c.T,rtol=1e-7,atol=1e-9):raise ValueError('刚度必须为有限对称 6×6 GPa 矩阵')
    if np.linalg.eigvalsh(c).min()<=0:raise ValueError('弹性刚度非正定，不能报告稳定材料的 VRH 模量')
    s=np.linalg.inv(c);diag=sum(c[i,i] for i in range(3));off=c[0,1]+c[0,2]+c[1,2]
    kv=(diag+2*off)/9;gv=(diag-off+3*(c[3,3]+c[4,4]+c[5,5]))/15
    sd=sum(s[i,i] for i in range(3));so=s[0,1]+s[0,2]+s[1,2]
    kr=1/(sd+2*so);gr=15/(4*(sd-so)+3*(s[3,3]+s[4,4]+s[5,5]));k=(kv+kr)/2;g=(gv+gr)/2
    summary={'bulk_Voigt_GPa':kv,'bulk_Reuss_GPa':kr,'bulk_Hill_GPa':k,'shear_Voigt_GPa':gv,'shear_Reuss_GPa':gr,'shear_Hill_GPa':g,'young_Hill_GPa':9*k*g/(3*k+g),'poisson_Hill':(3*k-2*g)/(2*(3*k+g)),'universal_anisotropy':5*gv/gr+kv/kr-6}
    out=result(summary,{'row':np.repeat(np.arange(1,7),6),'column':np.tile(np.arange(1,7),6),'stiffness_GPa':c.ravel(),'compliance_GPa_1':s.ravel()},kind='matrix',notes=['Voigt 次序 xx,yy,zz,yz,xz,xy；采用工程剪切应变约定。VRH 为随机多晶聚集体近似。'])
    out['plot'].update(matrix=c,xlabel='Voigt column',ylabel='Voigt row',unit='GPa');return out
